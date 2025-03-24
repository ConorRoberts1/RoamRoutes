import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query } from "firebase/firestore";
import { Feather } from "@expo/vector-icons";
import { firestore } from "../../config/firebaseConfig";
import { BackgroundGradient } from "../../constants/globalStyles";
import { handleLike, handlePass } from "../../utils/matchmakingUtils";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function Connections() {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1) Fetch all users except current user
  useEffect(() => {
    async function loadProfiles() {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn("No user logged in, cannot load connections.");
        return;
      }
      const currentUserId = currentUser.uid;

      try {
        const q = query(collection(firestore, "users"));
        const snapshot = await getDocs(q);

        const fetched = [];
        snapshot.forEach((docSnap) => {
          // Skip if it's the current user
          if (docSnap.id === currentUserId) return;

          const data = docSnap.data();
          const p = data.profile || {};
          fetched.push({
            userId: docSnap.id,
            name: p.name || "Unnamed",
            age: p.age || 18,
            bio: p.bio || "",
            location: p.location || "Unknown",
            images: p.images || [],
            hobbies: p.hobbies || [],
          });
        });
        setProfiles(fetched);
      } catch (err) {
        console.error("Error fetching user profiles:", err);
      }
    }
    loadProfiles();
  }, []);

  // If no profiles or we've gone beyond the last
  if (!profiles[currentIndex]) {
    return (
      <BackgroundGradient>
        <View style={styles.noProfilesContainer}>
          <Text style={styles.noProfilesText}>No more profiles available.</Text>
        </View>
      </BackgroundGradient>
    );
  }

  const profile = profiles[currentIndex];

  // 2) Handle "Pass"
  const onPass = async () => {
    // Write to Firestore
    await handlePass(profile.userId);
    // Move on to next
    setCurrentIndex((prev) => prev + 1);
  };

  // 3) Handle "Like"
  const onLike = async () => {
    // Write to Firestore
    await handleLike(profile.userId);
    // Move on to next
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        {/* Profile Card */}
        <ScrollView style={styles.scrollView}>
          {/* Photos */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.photoContainer}
          >
            {profile.images.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <LinearGradient
                  colors={["transparent", "rgba(0,0,0,0.7)"]}
                  style={styles.gradient}
                />
                <View style={styles.photoInfo}>
                  <Text style={styles.name}>
                    {profile.name}, {profile.age}
                  </Text>
                  <Text style={styles.location}>{profile.location}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Bio Section */}
          <View style={styles.section}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>

          {/* Hobbies Section */}
          {!!profile.hobbies.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.hobbiesContainer}>
                {profile.hobbies.map((hobby, index) => (
                  <View key={index} style={styles.hobbyItem}>
                    <Text style={styles.hobbyText}>{hobby}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={onPass}
          >
            <Feather name="x" size={32} color="#FF4B6F" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={onLike}
          >
            <Feather name="check" size={32} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent", // gradient behind
  },
  scrollView: {
    flex: 1,
  },
  noProfilesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noProfilesText: {
    fontSize: 18,
    color: "#fff",
  },
  photoContainer: {
    height: 500,
  },
  photoWrapper: {
    width: SCREEN_WIDTH,
    height: 500,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  photoInfo: {
    position: "absolute",
    bottom: 20,
    left: 20,
  },
  name: {
    fontSize: 28,
    color: "#fff",
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    color: "#fff",
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  bio: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: "#333",
  },
  hobbiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12, // React Native 0.71+ supports gap for flex
  },
  hobbyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 20,
    gap: 8,
  },
  hobbyText: {
    fontSize: 14,
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    // Shadow for iOS/Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  passButton: {
    backgroundColor: "#fff",
  },
  likeButton: {
    backgroundColor: "#fff",
  },
});