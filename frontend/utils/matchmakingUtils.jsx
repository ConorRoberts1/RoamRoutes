import { doc, setDoc, getDoc, collection, getDocs, query, addDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "../config/firebaseConfig";
import { getAuth } from "firebase/auth";
import { getProfile } from "./firebaseUtils"; // Assuming you have a getProfile(userId) function

/**
 * Fetch potential matches for the currently logged-in user
 * filtered by age/gender preferences, excluding liked/matched/passed users.
 */
export const fetchPotentialMatches = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("No user logged in. Cannot fetch matches.");
    return [];
  }

  // 1. Get current user's profile (for preferences).
  const currentUserProfile = await getProfile(currentUser.uid);
  if (!currentUserProfile) return [];

  const { ageRange, genderPreference } = currentUserProfile;

  // 2. Get ALL users from Firestore (except the current user).
  const snapshot = await getDocs(collection(firestore, "users"));
  const allUsers = [];
  snapshot.forEach((docSnap) => {
    allUsers.push({ userId: docSnap.id, ...docSnap.data() });
  });

  // 3. Filter out current user.
  let potentialMatches = allUsers.filter((u) => u.userId !== currentUser.uid);

  // 4. Filter out any user that doesn't have a profile or is missing data.
  potentialMatches = potentialMatches.filter((u) => u.profile);

  // 5. Filter by gender preference if you want a strict match of exactly one gender or multiple.
  //    If user has multiple preferences, we allow a match if the user's gender is in that array.
  if (Array.isArray(genderPreference) && genderPreference.length > 0) {
    potentialMatches = potentialMatches.filter((u) => {
      const userGender = u.profile.gender || "";
      return genderPreference.includes(userGender);
    });
  }

  // 6. Filter by age range
  if (Array.isArray(ageRange) && ageRange.length === 2) {
    potentialMatches = potentialMatches.filter((u) => {
      const userAge = u.profile.age;
      return userAge >= ageRange[0] && userAge <= ageRange[1];
    });
  }

  // 7. Exclude users you've already "liked" or "matched"...
  const currentUserId = currentUser.uid;

  // Liked users
  const likedDocSnap = await getDocs(collection(firestore, `users/${currentUserId}/likes`));
  const likedUserIds = likedDocSnap.docs.map((doc) => doc.id);

  // Matched users
  const matchedDocSnap = await getDocs(collection(firestore, `users/${currentUserId}/matches`));
  const matchedUserIds = matchedDocSnap.docs.map((doc) => doc.id);

  // Passed users (NEW)
  const passedDocSnap = await getDocs(collection(firestore, `users/${currentUserId}/passes`));
  const passedUserIds = passedDocSnap.docs.map((doc) => doc.id);

  // Filter them all out
  potentialMatches = potentialMatches.filter(
    (u) =>
      !likedUserIds.includes(u.userId) &&
      !matchedUserIds.includes(u.userId) &&
      !passedUserIds.includes(u.userId)
  );

  // 8. (Optional) Sort by some logic, e.g. random or an ELO rating if added
  // potentialMatches.sort((a, b) => (b.profile.eloRating || 1200) - (a.profile.eloRating || 1200));

  return potentialMatches;
};

/**
 * Handle a "Like" from the current user to another user (likedUserId).
 * - Creates a doc in `users/<currentUser>/likes/<likedUserId>`.
 * - Checks if the other user has already liked current user:
 *   - If yes, create a "match" doc in both subcollections.
 */
export const handleLike = async (likedUserId) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("No user logged in. Cannot like anyone.");
    return;
  }

  const currentUserId = currentUser.uid;

  try {
    // 1. Create a "like" doc in the current user’s likes subcollection
    await setDoc(doc(firestore, `users/${currentUserId}/likes`, likedUserId), {
      timestamp: new Date().toISOString(),
    });

    // 2. Check if the other user also liked the current user (i.e., does that doc exist?)
    const otherUserLikeRef = doc(firestore, `users/${likedUserId}/likes`, currentUserId);
    const otherUserLikeSnap = await getDoc(otherUserLikeRef);

    // 3. If the doc for (otherUser -> currentUser) exists => It's a match!
    if (otherUserLikeSnap.exists()) {
      // Create match docs in both "matches" subcollections
      await setDoc(doc(firestore, `users/${currentUserId}/matches`, likedUserId), {
        matchedWith: likedUserId,
        timestamp: new Date().toISOString(),
      });

      await setDoc(doc(firestore, `users/${likedUserId}/matches`, currentUserId), {
        matchedWith: currentUserId,
        timestamp: new Date().toISOString(),
      });

      // (Optional) Provide some success feedback
      console.log("It's a match!");
    }
  } catch (error) {
    console.error("Error in handleLike:", error.message);
  }
};

/**
 * Handle a "Pass" by the current user on another user (passedUserId).
 * - Creates a doc in `users/<currentUser>/passes/<passedUserId>`
 * so that user is excluded from the match feed next time.
 */
export const handlePass = async (passedUserId) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.warn("No user logged in. Cannot pass on anyone.");
    return;
  }

  const currentUserId = currentUser.uid;
  try {
    await setDoc(doc(firestore, `users/${currentUserId}/passes`, passedUserId), {
      timestamp: new Date().toISOString(),
    });
    console.log(`User ${currentUserId} passed on user ${passedUserId}`);
  } catch (error) {
    console.error("Error in handlePass:", error.message);
  }

};

export const createChatIfNotExists = async (chatId, userIds) => {
  const chatRef = doc(firestore, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    await setDoc(chatRef, {
      users: userIds,
      createdAt: new Date().toISOString(),
    });
  }

  return chatRef;
};

export const sendMessage = async (chatId, senderId, text) => {
  const messagesRef = collection(firestore, `chats/${chatId}/messages`);
  await addDoc(messagesRef, {
    senderId,
    text,
    timestamp: serverTimestamp(),
  });
};
