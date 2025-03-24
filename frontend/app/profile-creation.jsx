import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { uploadImages, saveProfile, getProfile } from "../utils/firebaseUtils"; // Ensure correct import
import { BackgroundGradient } from "../constants/globalStyles";

export default function ProfileCreation() {
  const router = useRouter();
  const [images, setImages] = useState([]);
  const [age, setAge] = useState("");
  const [hobbies, setHobbies] = useState([]);
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [ageRange, setAgeRange] = useState([18, 35]); // [minAge, maxAge]
  const [genderPreference, setGenderPreference] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for hobbies, genders, and languages
  const hobbiesList = ["Hiking", "Camping", "Surfing", "Skiing", "Photography", "Cooking", "Yoga", "Cycling"];
  const genderOptions = ["Male", "Female", "Non-binary", "Other"];
  const languageOptions = ["English", "Spanish", "French", "German", "Mandarin", "Japanese"];

  // Fetch existing profile data if editing
  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await getProfile(auth.currentUser.uid);
      if (profile) {
        setImages(profile.images || []);
        setAge(profile.age || "");
        setSelectedHobbies(profile.hobbies || []);
        setAgeRange(profile.ageRange || [18, 35]);
        setGenderPreference(profile.genderPreference || []);
        setSelectedLanguages(profile.languages || []);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Please allow access to your photo library to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use ImagePicker.MediaType instead of ImagePicker.MediaTypeOptions
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
      await saveProfile({
        age: parseInt(age),
        images: imageUrls,
        hobbies: selectedHobbies,
        ageRange,
        genderPreference,
        languages: selectedLanguages,
      });

      Alert.alert("Success", "Profile saved successfully!");
      router.replace('/trips');
    } catch (error) {
      console.error("Error saving profile:", error.message);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHobby = (hobby) => {
    setSelectedHobbies((prev) =>
      prev.includes(hobby) ? prev.filter((h) => h !== hobby) : [...prev, hobby]
    );
  };

  const toggleLanguage = (language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]
    );
  };

  const handleSkipProfileCreation = () => {
    router.replace('/trips'); // Navigate to trips without saving a profile
  };

  return (
    <BackgroundGradient>
      <ScrollView contentContainerStyle={styles.container}>
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

        <Text style={styles.subtitle}>Hobbies</Text>
        <View style={styles.bubbleContainer}>
          {hobbiesList.map((hobby) => (
            <TouchableOpacity
              key={hobby}
              style={[
                styles.bubble,
                selectedHobbies.includes(hobby) && styles.selectedBubble,
              ]}
              onPress={() => toggleHobby(hobby)}
            >
              <Text style={styles.bubbleText}>{hobby}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subtitle}>Age Range Preference</Text>
        <View style={styles.sliderContainer}>
          <Text>Min: {ageRange[0]}</Text>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={100}
            step={1}
            value={ageRange[0]}
            onValueChange={(value) => setAgeRange([value, ageRange[1]])}
          />
          <Text>Max: {ageRange[1]}</Text>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={100}
            step={1}
            value={ageRange[1]}
            onValueChange={(value) => setAgeRange([ageRange[0], value])}
          />
        </View>

        <Text style={styles.subtitle}>Gender Preference</Text>
        <View style={styles.bubbleContainer}>
          {genderOptions.map((gender) => (
            <TouchableOpacity
              key={gender}
              style={[
                styles.bubble,
                genderPreference.includes(gender) && styles.selectedBubble,
              ]}
              onPress={() =>
                setGenderPreference((prev) =>
                  prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
                )
              }
            >
              <Text style={styles.bubbleText}>{gender}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subtitle}>Languages</Text>
        <View style={styles.bubbleContainer}>
          {languageOptions.map((language) => (
            <TouchableOpacity
              key={language}
              style={[
                styles.bubble,
                selectedLanguages.includes(language) && styles.selectedBubble,
              ]}
              onPress={() => toggleLanguage(language)}
            >
              <Text style={styles.bubbleText}>{language}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={handleSaveProfile} style={styles.button} disabled={isLoading}>
          <Text style={styles.buttonText}>{isLoading ? "Saving..." : "Save Profile"}</Text>
        </TouchableOpacity>

        {/* Skip Profile Creation Button */}
        <TouchableOpacity onPress={handleSkipProfileCreation} style={styles.skipButton}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </ScrollView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
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
  bubbleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  bubble: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    margin: 5,
  },
  selectedBubble: {
    backgroundColor: "black",
  },
  bubbleText: {
    color: "black",
  },
  sliderContainer: {
    marginBottom: 20,
  },
  slider: {
    width: "100%",
    height: 40,
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