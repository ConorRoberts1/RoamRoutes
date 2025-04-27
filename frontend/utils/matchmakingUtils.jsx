import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "../config/firebaseConfig";
import { getAuth } from "firebase/auth";
import { getProfile } from "./firebaseUtils";

// Fetch potential matches based on age and gender preferences
export const fetchPotentialMatches = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const currentUserId = currentUser.uid;
  const currentUserProfile = await getProfile(currentUserId);
  if (!currentUserProfile) return [];

  const { ageRange, genderPreference } = currentUserProfile;

  // Get all users
  const snapshot = await getDocs(collection(firestore, "users"));
  const allUsers = snapshot.docs
    .filter((docSnap) => docSnap.id !== currentUserId)
    .map((docSnap) => ({ userId: docSnap.id, ...docSnap.data() }))
    .filter((u) => u.profile);

  let potentialMatches = allUsers;

  // Filter by age range
  if (Array.isArray(ageRange) && ageRange.length === 2) {
    const [minAge, maxAge] = ageRange.map(Number);
    potentialMatches = potentialMatches.filter((u) => {
      const userAge = parseInt(u.profile.age);
      return !isNaN(userAge) && userAge >= minAge && userAge <= maxAge;
    });
  }

  // Filter by gender preference
  if (Array.isArray(genderPreference) && genderPreference.length > 0) {
    potentialMatches = potentialMatches.filter((u) => {
      const userGender = u.profile.gender || "";
      return genderPreference.includes(userGender);
    });
  }

  try {
    // Get all collections that track interactions
    const [likedDocs, matchedDocs, passedDocs, unmatchedDocs] = await Promise.all([
      getDocs(collection(firestore, `users/${currentUserId}/likes`)),
      getDocs(collection(firestore, `users/${currentUserId}/matches`)),
      getDocs(collection(firestore, `users/${currentUserId}/passes`)),
      getDocs(collection(firestore, `users/${currentUserId}/unmatched`))
    ]);

    // Create a set for efficient lookup of interacted user IDs
    const interactedIds = new Set([
      ...likedDocs.docs.map(doc => doc.id),
      ...matchedDocs.docs.map(doc => doc.id),
      ...passedDocs.docs.map(doc => doc.id),
      ...unmatchedDocs.docs.map(doc => doc.id)
    ]);

    // Filter out users we've already interacted with
    potentialMatches = potentialMatches.filter(u => !interactedIds.has(u.userId));
  } catch (error) {
    console.error("Error checking previous interactions:", error);
    // If we can't check previous interactions, just return the filtered matches
  }

  return potentialMatches;
};

// Like a user and handle matching if the like is mutual
export const handleLike = async (likedUserId) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const currentUserId = currentUser.uid;

    // First check if we've already interacted with this user
    const [matchDoc, passDoc, unmatchDoc] = await Promise.all([
      getDoc(doc(firestore, `users/${currentUserId}/matches`, likedUserId)),
      getDoc(doc(firestore, `users/${currentUserId}/passes`, likedUserId)),
      getDoc(doc(firestore, `users/${currentUserId}/unmatched`, likedUserId))
    ]);

    // Don't proceed if we've already matched, passed, or unmatched
    if (matchDoc.exists() || passDoc.exists() || unmatchDoc.exists()) {
      console.log("Already interacted with this user, skipping like");
      return false;
    }

    // Add to likes collection
    await setDoc(doc(firestore, `users/${currentUserId}/likes`, likedUserId), {
      timestamp: new Date().toISOString(),
    });

    // Check if other user has liked current user
    const otherLikeDoc = await getDoc(doc(firestore, `users/${likedUserId}/likes`, currentUserId));
    
    if (otherLikeDoc.exists()) {
      // It's a match! Use a batch for atomic operations
      const batch = writeBatch(firestore);
      
      // Add to matches for both users
      batch.set(doc(firestore, `users/${currentUserId}/matches`, likedUserId), {
        matchedWith: likedUserId,
        timestamp: new Date().toISOString(),
      });
      
      batch.set(doc(firestore, `users/${likedUserId}/matches`, currentUserId), {
        matchedWith: currentUserId,
        timestamp: new Date().toISOString(),
      });
      
      // Remove from likes for both users
      batch.delete(doc(firestore, `users/${currentUserId}/likes`, likedUserId));
      batch.delete(doc(firestore, `users/${likedUserId}/likes`, currentUserId));
      
      // Create chat document
      const chatId = [currentUserId, likedUserId].sort().join('_');
      batch.set(doc(firestore, 'chats', chatId), {
        users: [currentUserId, likedUserId],
        createdAt: new Date().toISOString(),
      });
      
      await batch.commit();
      return true;
    }
    
    return true;
  } catch (error) {
    console.error("Error during like:", error);
    return false;
  }
};

// Pass (skip) a user
export const handlePass = async (passedUserId) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const currentUserId = currentUser.uid;

    // Check if we've already interacted with this user
    const [matchDoc, likeDoc, unmatchDoc] = await Promise.all([
      getDoc(doc(firestore, `users/${currentUserId}/matches`, passedUserId)),
      getDoc(doc(firestore, `users/${currentUserId}/likes`, passedUserId)),
      getDoc(doc(firestore, `users/${currentUserId}/unmatched`, passedUserId))
    ]);

    // Don't proceed if we've already matched, liked, or unmatched
    if (matchDoc.exists() || likeDoc.exists() || unmatchDoc.exists()) {
      console.log("Already interacted with this user, skipping pass");
      return false;
    }

    // Add to passes collection
    await setDoc(doc(firestore, `users/${currentUserId}/passes`, passedUserId), {
      timestamp: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error during pass:", error);
    return false;
  }
};

// Unmatch two users
export const handleUnmatch = async (currentUserId, otherUserId) => {
  try {
    // Use batch to ensure atomic operations
    const batch = writeBatch(firestore);
    
    // Remove from matches collection for both users
    batch.delete(doc(firestore, `users/${currentUserId}/matches`, otherUserId));
    batch.delete(doc(firestore, `users/${otherUserId}/matches`, currentUserId));
    
    // Add to unmatched collection for both users
    batch.set(doc(firestore, `users/${currentUserId}/unmatched`, otherUserId), {
      timestamp: new Date().toISOString(),
    });
    batch.set(doc(firestore, `users/${otherUserId}/unmatched`, currentUserId), {
      timestamp: new Date().toISOString(),
    });
    
    // Remove any potential likes that might still exist
    batch.delete(doc(firestore, `users/${currentUserId}/likes`, otherUserId));
    batch.delete(doc(firestore, `users/${otherUserId}/likes`, currentUserId));

    // Get the chat ID
    const chatId = [currentUserId, otherUserId].sort().join('_');
    
    // Commit the batch before handling chat deletion
    await batch.commit();
    
    // Delete chat messages and document
    await deleteChat(chatId);
    
    return true;
  } catch (error) {
    console.error("Error during unmatch:", error);
    return false;
  }
};

// Helper function to delete a chat and all its messages
const deleteChat = async (chatId) => {
  try {
    // Get all messages in the chat
    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    
    if (!messagesSnapshot.empty) {
      let batch = writeBatch(firestore);
      let operationCount = 0;
      
      messagesSnapshot.docs.forEach((messageDoc) => {
        batch.delete(doc(firestore, `chats/${chatId}/messages`, messageDoc.id));
        operationCount++;
        
        // Firebase has a limit of 500 operations per batch
        if (operationCount >= 450) {
          batch.commit();
          batch = writeBatch(firestore); // Create a new batch
          operationCount = 0;
        }
      });
      
      // Commit any remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }
    }
    
    // Delete the chat document
    await deleteDoc(doc(firestore, 'chats', chatId));
    return true;
  } catch (error) {
    console.error("Error deleting chat:", error);
    return false;
  }
};

// Create chat between users if it doesn't exist
export const createChatIfNotExists = async (chatId, userIds) => {
  try {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: userIds,
        createdAt: new Date().toISOString(),
      });
    }

    return chatRef;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
};

// Send a message in a chat
export const sendMessage = async (chatId, senderId, text) => {
  try {
    const messagesRef = collection(firestore, `chats/${chatId}/messages`);
    await addDoc(messagesRef, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
};

// Reset user interactions (for testing/development)
export const resetUserInteractions = async (userId) => {
  try {
    const collectionsToReset = ['likes', 'passes', 'matches', 'unmatched'];
    
    for (const collectionName of collectionsToReset) {
      const collectionRef = collection(firestore, `users/${userId}/${collectionName}`);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) continue;
      
      let batch = writeBatch(firestore);
      let operationCount = 0;
      
      snapshot.docs.forEach((docSnap) => {
        batch.delete(doc(firestore, `users/${userId}/${collectionName}`, docSnap.id));
        operationCount++;
        
        if (operationCount >= 450) {
          batch.commit();
          batch = writeBatch(firestore); // Create a new batch
          operationCount = 0;
        }
      });
      
      if (operationCount > 0) {
        await batch.commit();
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error resetting user interactions:", error);
    return false;
  }
};

// Check if users are matched
export const checkIfMatched = async (userId1, userId2) => {
  try {
    const matchDoc = await getDoc(doc(firestore, `users/${userId1}/matches`, userId2));
    return matchDoc.exists();
  } catch (error) {
    console.error("Error checking match status:", error);
    return false;
  }
};

// Only for debugging: Get all interaction collections
export const getUserInteractions = async (userId) => {
  try {
    const collectionsToGet = ['likes', 'passes', 'matches', 'unmatched'];
    const interactions = {};
    
    for (const collectionName of collectionsToGet) {
      const collectionRef = collection(firestore, `users/${userId}/${collectionName}`);
      const snapshot = await getDocs(collectionRef);
      
      interactions[collectionName] = snapshot.docs.map(doc => ({
        userId: doc.id,
        ...doc.data()
      }));
    }
    
    return interactions;
  } catch (error) {
    console.error("Error getting user interactions:", error);
    return null;
  }
};