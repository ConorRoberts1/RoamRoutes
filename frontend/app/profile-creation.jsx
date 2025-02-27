import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { uploadImages, saveProfile } from "../utils/firebaseUtils"; // Utility functions for Firebase
import { BackgroundGradient } from "../constants/globalStyles";

export default function ProfileCreation() {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow access to your photo library to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedImages].slice(0, 6)); // Limit to 6 images
    }
  };

  const handleSaveProfile = async () => {
    if (images.length < 2) {
      Alert.alert("Error", "Please upload at least 2 pictures.");
      return;
    }

    if (!age || isNaN(age)) {
      Alert.alert("Error", "Please enter a valid age.");
      return;
    }

    if (parseInt(age) < 18) {
      Alert.alert("Error", "You must be 18 or older to create a profile.");
      return;
    }

    setIsLoading(true);

    try {
      // Upload images to Firebase Storage and get their URLs
      const imageUrls = await uploadImages(images);

      // Save profile data to Firestore
      await saveProfile({ age: parseInt(age), images: imageUrls });

      Alert.alert("Success", "Profile created successfully!");
      router.replace('/trips');
    } catch (error) {
      console.error("Error saving profile:", error.message);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipProfileCreation = () => {
    router.replace('/trips'); // Navigate to trips without saving a profile
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.title}>Create Your Profile</Text>

        <Text style={styles.subtitle}>Upload Pictures</Text>
        <Text style={styles.note}>(Minimum 2, Maximum 6)</Text>

        <View style={styles.imageContainer}>
          {images.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.image} />
          ))}
          {images.length < 6 && (
            <TouchableOpacity onPress={handleImageUpload} style={styles.uploadButton}>
              <Text style={styles.uploadButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.subtitle}>Age</Text>
        <TextInput
          style={styles.input}
          onChangeText={setAge}
          value={age}
          placeholder="Enter your age"
          placeholderTextColor="gray"
          keyboardType="numeric"
        />

        <TouchableOpacity onPress={handleSaveProfile} style={styles.button} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? "Saving..." : "Save Profile"}</Text>
        </TouchableOpacity>

        {/* Skip Profile Creation Button */}
        <TouchableOpacity onPress={handleSkipProfileCreation} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    marginTop: 50,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
  },
  note: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
    margin: 5,
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  uploadButtonText: {
    fontSize: 30,
    color: "black",
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: "black",
    marginBottom: 20,
  },
  button: {
    padding: 15,
    backgroundColor: "black",
    borderRadius: 15,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  skipButton: {
    padding: 15,
    backgroundColor: "transparent",
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "black",
  },
  skipButtonText: {
    color: "black",
    textAlign: "center",
  },
});