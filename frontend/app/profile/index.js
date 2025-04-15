import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { getProfile, uploadImages, saveProfile } from "../../utils/firebaseUtils";
import { BackgroundGradient } from "../../constants/globalStyles";
import * as ImagePicker from "expo-image-picker";

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [images, setImages] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      const userProfile = await getProfile();
      if (userProfile) {
        setProfile(userProfile);
        setImages(userProfile.images || []);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleImageUpload = async (index) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow access to your photo library to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = [...images];
      newImages[index] = result.assets[0].uri;
      setImages(newImages);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const imageUrls = await uploadImages(images);
      await saveProfile({ ...profile, images: imageUrls });
      Alert.alert("Success", "Profile updated successfully!");
      setEditing(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  if (loading) {
    return (
      <BackgroundGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      </BackgroundGradient>
    );
  }

  if (!profile) {
    return (
      <BackgroundGradient>
        <View style={styles.center}>
          <Text style={styles.noProfileText}>No profile found</Text>
          <TouchableOpacity style={styles.createProfileButton} onPress={() => router.push("/profile-creation")}> 
            <Text style={styles.buttonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{profile.name}</Text>
        <Text style={styles.age}>{profile.age} years old</Text>
        
        <View style={styles.imageContainer}>
          {images.map((uri, index) => (
            <TouchableOpacity key={index} onPress={() => editing && handleImageUpload(index)}>
              <Image source={{ uri }} style={styles.profileImage} />
            </TouchableOpacity>
          ))}
        </View>
        
        <Text style={styles.sectionTitle}>Hobbies</Text>
        <Text style={styles.details}>{profile.hobbies.join(", ")}</Text>

        <Text style={styles.sectionTitle}>Preferred Age Range</Text>
        <Text style={styles.details}>{profile.ageRange[0]} - {profile.ageRange[1]}</Text>

        <Text style={styles.sectionTitle}>Gender Preference</Text>
        <Text style={styles.details}>{profile.genderPreference.join(", ")}</Text>

        <Text style={styles.sectionTitle}>Languages Spoken</Text>
        <Text style={styles.details}>{profile.languages.join(", ")}</Text>

        {editing ? (
          <TouchableOpacity onPress={handleSaveProfile} style={styles.button}>
            <Text style={styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.button}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "black",
  },
  age: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    color: "black",
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    margin: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  details: {
    fontSize: 16,
    color: "black",
  },
  button: {
    padding: 15,
    backgroundColor: "black",
    borderRadius: 15,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  noProfileText: {
    fontSize: 20,
    color: "black",
    textAlign: "center",
    marginBottom: 20,
  },
  createProfileButton: {
    padding: 15,
    backgroundColor: "black",
    borderRadius: 15,
    alignItems: "center",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
