import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Slider from "@react-native-community/slider";
import { uploadImages, saveProfile, getProfile } from "../utils/firebaseUtils";
import { BackgroundGradient } from "../constants/globalStyles";
import * as Animatable from 'react-native-animatable';
import { getAuth } from "firebase/auth";

export default function ProfileCreation() {
  const router = useRouter();
  const auth = getAuth();
  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState(""); // Added gender state
  const [selectedHobbies, setSelectedHobbies] = useState([]);
  const [ageRange, setAgeRange] = useState([18, 35]); // [minAge, maxAge]
  const [genderPreference, setGenderPreference] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);

  // Expanded hobby list with more travel-relevant options
  const hobbiesList = [
    "Hiking", "Camping", "Surfing", "Skiing", "Photography", "Cooking", "Yoga", "Cycling",
    "Beach", "Museums", "Nightlife", "Food Tours", "City Walks", "Adventure", "Shopping",
    "History", "Art", "Music", "Wildlife", "Architecture", "Local Culture", "Road Trips",
    "Mountain Climbing", "Festivals", "Markets", "Solo Travel", "Group Tours", "Backpacking"
  ];
  
  const genderOptions = ["Male", "Female", "Other"];
  const languageOptions = ["English", "Spanish", "French", "German", "Mandarin", "Japanese", "Italian", "Portuguese", "Arabic", "Russian"];

  // Fetch existing profile data if editing
  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) {
        setIsInitialLoading(false);
        return;
      }
      
      try {
        const profile = await getProfile(auth.currentUser.uid);
        if (profile) {
          // Profile exists, set edit mode
          setExistingProfile(profile);
          setIsEditMode(true);
          
          // Populate form fields with existing data
          setName(profile.name || "");
          setImages(profile.images || []);
          setAge(profile.age ? profile.age.toString() : "");
          setGender(profile.gender || ""); // Set existing gender
          setSelectedHobbies(profile.hobbies || []);
          setAgeRange(profile.ageRange || [18, 35]);
          setGenderPreference(profile.genderPreference || []);
          setSelectedLanguages(profile.languages || []);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsInitialLoading(false);
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImages = result.assets.map((asset) => asset.uri);
      setImages((prev) => [...prev, ...selectedImages].slice(0, 6)); // Limit to 6 images
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name.");
      return;
    }

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
    
    if (!gender) {
      Alert.alert("Error", "Please select your gender.");
      return;
    }

    setIsLoading(true);

    try {
      // Determine which images need to be uploaded
      let imageUrls = [];
      
      // For edit mode, determine which images are already URLs vs local URIs
      const imagesToUpload = images.filter(img => img.startsWith('file:') || img.startsWith('content:'));
      const existingImageUrls = images.filter(img => !img.startsWith('file:') && !img.startsWith('content:'));
      
      // Only upload new images
      if (imagesToUpload.length > 0) {
        const newImageUrls = await uploadImages(imagesToUpload);
        imageUrls = [...existingImageUrls, ...newImageUrls];
      } else {
        imageUrls = existingImageUrls;
      }

      // Save profile data to Firestore
      await saveProfile({
        name: name.trim(),
        age: parseInt(age),
        gender, // Save gender
        images: imageUrls,
        hobbies: selectedHobbies,
        ageRange,
        genderPreference,
        languages: selectedLanguages,
      });

      Alert.alert(
        "Success", 
        isEditMode ? "Profile updated successfully!" : "Profile created successfully!", 
        [{ text: "OK", onPress: () => router.replace('/trips') }]
      );
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
    Alert.alert(
      "Skip Profile Creation",
      "Creating a profile helps you connect with other travelers. Are you sure you want to skip?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Skip",
          onPress: () => router.replace('/trips')
        }
      ]
    );
  };

  if (isInitialLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading profile data...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <ScrollView contentContainerStyle={styles.container}>
        <Animatable.Text animation="fadeIn" duration={800} style={styles.title}>
          {isEditMode ? "Edit Your Profile" : "Create Your Profile"}
        </Animatable.Text>

        <Animatable.View animation="fadeIn" delay={200} duration={800}>
          <Text style={styles.subtitle}>Your Name</Text>
          <TextInput
            style={styles.input}
            onChangeText={setName}
            value={name}
            placeholder="Enter your name"
            placeholderTextColor="gray"
          />
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={300} duration={800}>
          <Text style={styles.subtitle}>Upload Pictures</Text>
          <Text style={styles.note}>(Minimum 2, Maximum 6)</Text>

          <View style={styles.imageContainer}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.image} />
                <TouchableOpacity 
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 6 && (
              <TouchableOpacity onPress={handleImageUpload} style={styles.uploadButton}>
                <Text style={styles.uploadButtonText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={400} duration={800}>
          <Text style={styles.subtitle}>Age</Text>
          <TextInput
            style={styles.input}
            onChangeText={setAge}
            value={age}
            placeholder="Enter your age"
            placeholderTextColor="gray"
            keyboardType="numeric"
          />
        </Animatable.View>

        {/* Added Gender Selection */}
        <Animatable.View animation="fadeIn" delay={450} duration={800}>
          <Text style={styles.subtitle}>Gender</Text>
          <Text style={styles.note}>Select one</Text>
          <View style={styles.bubbleContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.bubble,
                  gender === option && styles.selectedBubble,
                ]}
                onPress={() => setGender(option)}
              >
                <Text 
                  style={[
                    styles.bubbleText,
                    gender === option && styles.selectedBubbleText
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={500} duration={800}>
          <Text style={styles.subtitle}>Travel Interests</Text>
          <Text style={styles.note}>Select all that apply</Text>
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
                <Text 
                  style={[
                    styles.bubbleText,
                    selectedHobbies.includes(hobby) && styles.selectedBubbleText
                  ]}
                >
                  {hobby}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={600} duration={800}>
          <Text style={styles.subtitle}>Age Range Preference</Text>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderLabelContainer}>
              <Text style={styles.sliderLabel}>Min: {Math.round(ageRange[0])}</Text>
              <Text style={styles.sliderLabel}>Max: {Math.round(ageRange[1])}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={100}
              step={1}
              value={ageRange[0]}
              minimumTrackTintColor="#CBC3E3"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="black"
              onValueChange={(value) => setAgeRange([value, ageRange[1]])}
            />
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={100}
              step={1}
              value={ageRange[1]}
              minimumTrackTintColor="#CBC3E3"
              maximumTrackTintColor="#e0e0e0"
              thumbTintColor="black"
              onValueChange={(value) => setAgeRange([ageRange[0], value])}
            />
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={700} duration={800}>
          <Text style={styles.subtitle}>Gender Preference</Text>
          <Text style={styles.note}>Select all that apply</Text>
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
                <Text 
                  style={[
                    styles.bubbleText,
                    genderPreference.includes(gender) && styles.selectedBubbleText
                  ]}
                >
                  {gender}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={800} duration={800}>
          <Text style={styles.subtitle}>Languages</Text>
          <Text style={styles.note}>Select all that you speak</Text>
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
                <Text 
                  style={[
                    styles.bubbleText,
                    selectedLanguages.includes(language) && styles.selectedBubbleText
                  ]}
                >
                  {language}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animatable.View>

        <Animatable.View animation="fadeIn" delay={900} duration={800}>
          <TouchableOpacity 
            onPress={handleSaveProfile} 
            style={styles.button} 
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Saving..." : (isEditMode ? "Update Profile" : "Save Profile")}
            </Text>
          </TouchableOpacity>

          {!isEditMode && (
            <TouchableOpacity 
              onPress={handleSkipProfileCreation} 
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>
          )}

          {isEditMode && (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.skipButton}
            >
              <Text style={styles.skipButtonText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </Animatable.View>
      </ScrollView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingBottom: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#000",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "black",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    color: "black",
  },
  note: {
    fontSize: 14,
    color: "gray",
    marginBottom: 10,
    marginTop: 2,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    justifyContent: "flex-start",
  },
  imageWrapper: {
    position: "relative",
    margin: 5,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 15,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  removeImageText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: 30,
    color: "#777",
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: "#ccc",
    marginBottom: 10,
    marginTop: 5,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
  },
  bubbleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  bubble: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    margin: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  selectedBubble: {
    backgroundColor: "#CBC3E3",
    borderColor: "#9370DB",
  },
  bubbleText: {
    fontSize: 14,
    color: "#333",
  },
  selectedBubbleText: {
    fontWeight: "bold",
    color: "#4A0082",
  },
  sliderContainer: {
    marginVertical: 15,
  },
  sliderLabelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sliderLabel: {
    color: "black",
    fontSize: 16,
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  skipButton: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  skipButtonText: {
    color: "#666",
    textAlign: "center",
    fontSize: 16,
  },
});