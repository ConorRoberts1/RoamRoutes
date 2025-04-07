import { doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { firestore, storage } from "../config/firebaseConfig"; // Import Firebase Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Create User Document
export const createUser = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User not logged in!");
    return;
  }

  const userId = user.uid;
  const userEmail = user.email;

  try {
    const userDocRef = doc(firestore, "users", userId);
    await setDoc(
      userDocRef,
      {
        email: userEmail,
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log("User document created successfully");
  } catch (error) {
    console.error("Error creating user document:", error.message);
  }
};

// Check if a user has a profile
export const checkProfileExists = async (userId) => {
  try {
    const userDocRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userDocRef);

    // Check if the document exists and has a profile field
    return userDoc.exists() && userDoc.data().profile !== undefined;
  } catch (error) {
    console.error("Error checking profile existence:", error.message);
    return false;
  }
};

// Save Profile Data
export const saveProfile = async (profileData) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User not logged in!");
    return;
  }

  const userId = user.uid;

  try {
    const userDocRef = doc(firestore, "users", userId);
    await setDoc(
      userDocRef,
      {
        profile: profileData,
      },
      { merge: true }
    );
    console.log("Profile saved successfully");
  } catch (error) {
    console.error("Error saving profile:", error.message);
  }
};

// Create a New Trip
export const createTrip = async (tripName) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User not logged in!");
    return;
  }

  const userId = user.uid;
  const tripId = `trip_${Date.now()}`;

  try {
    const tripDocRef = doc(firestore, `users/${userId}/trips`, tripId);
    await setDoc(tripDocRef, {
      name: tripName,
      createdAt: new Date().toISOString(),
    });
    console.log("Trip document created successfully");
    return tripId; // Return tripId for further use
  } catch (error) {
    console.error("Error creating trip document:", error.message);
  }
};

// Add Location to a Trip
export const addLocationToTrip = async (tripId, locationData) => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error("User not logged in!");
    return;
  }

  if (!locationData || !locationData.place_id) {
    console.error("Invalid location data provided:", locationData);
    return;
  }

  const userId = user.uid;

  try {
    const locationDocRef = doc(firestore, `users/${userId}/trips/${tripId}/locations`, locationData.place_id);
    await setDoc(locationDocRef, locationData);
    console.log("Location added successfully");
  } catch (error) {
    console.error("Error adding location to trip:", error.message);
  }
};

// Function to upload images to Firebase Storage
export const uploadImages = async (images) => {
  const imageUrls = [];

  for (const uri of images) {
    try {
      console.log("Uploading image:", uri);

      // Convert the image URI to a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log("Blob created:", blob);

      // Create a reference to the Firebase Storage path
      const storageRef = ref(storage, `profile-images/${Date.now()}-${Math.random().toString(36)}`);
      console.log("Storage reference created:", storageRef);

      // Upload the image
      await uploadBytes(storageRef, blob);
      console.log("Image uploaded successfully");

      // Get the download URL of the uploaded image
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL:", downloadURL);

      imageUrls.push(downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  return imageUrls;
};
