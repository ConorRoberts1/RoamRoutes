import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "../config/firebaseConfig";
import { getAuth } from "firebase/auth";
import { getProfile } from "./firebaseUtils";

export const fetchPotentialMatches = async () => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const currentUserId = currentUser.uid;
  const currentUserProfile = await getProfile(currentUserId);
  if (!currentUserProfile) return [];

  const { ageRange, genderPreference } = currentUserProfile;

  const snapshot = await getDocs(collection(firestore, "users"));
  const allUsers = snapshot.docs
    .filter((docSnap) => docSnap.id !== currentUserId)
    .map((docSnap) => ({ userId: docSnap.id, ...docSnap.data() }))
    .filter((u) => u.profile);

  let potentialMatches = allUsers;

  if (Array.isArray(genderPreference) && genderPreference.length > 0) {
    potentialMatches = potentialMatches.filter((u) =>
      genderPreference.includes(u.profile.gender || "")
    );
  }

  if (Array.isArray(ageRange) && ageRange.length === 2) {
    potentialMatches = potentialMatches.filter((u) => {
      const age = u.profile.age;
      return age >= ageRange[0] && age <= ageRange[1];
    });
  }

  const likedDocs = await getDocs(collection(firestore, `users/${currentUserId}/likes`));
  const matchedDocs = await getDocs(collection(firestore, `users/${currentUserId}/matches`));
  const passedDocs = await getDocs(collection(firestore, `users/${currentUserId}/passes`));

  const likedIds = likedDocs.docs.map((doc) => doc.id);
  const matchedIds = matchedDocs.docs.map((doc) => doc.id);
  const passedIds = passedDocs.docs.map((doc) => doc.id);

  potentialMatches = potentialMatches.filter(
    (u) =>
      !likedIds.includes(u.userId) &&
      !matchedIds.includes(u.userId) &&
      !passedIds.includes(u.userId)
  );

  return potentialMatches;
};

export const handleLike = async (likedUserId) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const currentUserId = currentUser.uid;

  const matchSnap = await getDoc(doc(firestore, `users/${currentUserId}/matches`, likedUserId));
  if (matchSnap.exists()) return;

  await setDoc(doc(firestore, `users/${currentUserId}/likes`, likedUserId), {
    timestamp: new Date().toISOString(),
  });

  const otherLikeSnap = await getDoc(doc(firestore, `users/${likedUserId}/likes`, currentUserId));
  if (otherLikeSnap.exists()) {
    await setDoc(doc(firestore, `users/${currentUserId}/matches`, likedUserId), {
      matchedWith: likedUserId,
      timestamp: new Date().toISOString(),
    });

    await setDoc(doc(firestore, `users/${likedUserId}/matches`, currentUserId), {
      matchedWith: currentUserId,
      timestamp: new Date().toISOString(),
    });

    await Promise.all([
      deleteDoc(doc(firestore, `users/${currentUserId}/likes`, likedUserId)),
      deleteDoc(doc(firestore, `users/${likedUserId}/likes`, currentUserId)),
    ]);
  }
};

export const handlePass = async (passedUserId) => {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const currentUserId = currentUser.uid;

  const matchSnap = await getDoc(doc(firestore, `users/${currentUserId}/matches`, passedUserId));
  if (matchSnap.exists()) return;

  await setDoc(doc(firestore, `users/${currentUserId}/passes`, passedUserId), {
    timestamp: new Date().toISOString(),
  });
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
