import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Image } from 'expo-image';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query } from "firebase/firestore";
import { Feather } from "@expo/vector-icons";
import { firestore } from "../../config/firebaseConfig";
import { BackgroundGradient } from "../../constants/globalStyles";
import { handleLike, handlePass } from "../../utils/matchmakingUtils";

const SCREEN_WIDTH = Dimensions.get("window").width;
const blurhash = "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."; 

export default function Connections() {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  
  useEffect(() => {
    async function loadProfiles() {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.warn("No user logged in, cannot load connections.");
        setIsInitialLoading(false);
        return;
      }
      const currentUserId = currentUser.uid;

      try {
        setIsInitialLoading(true);
        const q = query(collection(firestore, "users"));
        const snapshot = await getDocs(q);
        const fetched = [];

        snapshot.forEach((docSnap) => {
          if (docSnap.id === currentUserId) return;
          const data = docSnap.data();
          const p = data.profile || {};
          if (p.images && p.images.length > 0) {
            fetched.push({
              userId: docSnap.id,
              name: p.name || "Unnamed",
              age: p.age || 18,
              bio: p.bio || "",
              location: p.location || "Unknown",
              images: p.images,
              hobbies: p.hobbies || [],
            });
          }
        });

        // Pre-warm the image cache by telling the system which images we'll need
        if (fetched.length > 0) {
          const allImageUrls = fetched.flatMap(profile => profile.images);
          Image.prefetch(allImageUrls);
        }

        setProfiles(fetched);
      } catch (err) {
        console.error("Error fetching user profiles:", err);
      } finally {
        setIsInitialLoading(false);
      }
    }

    loadProfiles();
  }, []);

  const profile = profiles[currentIndex];

  const onPass = async () => {
    if (!profile) return;
    
    setIsTransitioning(true);
    try {
      await handlePass(profile.userId);
    } catch (error) {
      console.error("Error handling pass:", error);
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 500);
  };

  const onLike = async () => {
    if (!profile) return;
    
    setIsTransitioning(true);
    try {
      await handleLike(profile.userId);
    } catch (error) {
      console.error("Error handling like:", error);
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 500);
  };

  // Show loading state during initial data fetch
  if (isInitialLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading profiles...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  // No more profiles
  if (!profile) {
    return (
      <BackgroundGradient>
        <View style={styles.noProfilesContainer}>
          <Text style={styles.noProfilesText}>No more profiles available.</Text>
        </View>
      </BackgroundGradient>
    );
  }

  // Transition between profiles
  if (isTransitioning) {
    return (
      <BackgroundGradient>
        <View style={styles.transitionContainer}>
          <Animatable.Image
            source={require('../../assets/images/logo.png')} 
            iterationCount="infinite"
            duration={1000}
            style={styles.logo}
          />
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.photoContainer}
          >
            {profile.images.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={300}
                  placeholder={blurhash}
                  cachePolicy="memory-disk"
                />
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

          <View style={styles.section}>
            <Text style={styles.bio}>{profile.bio}</Text>
          </View>

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
  // Your existing styles...
  container: { flex: 1, backgroundColor: "transparent" },
  scrollView: { flex: 1 },
  noProfilesContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noProfilesText: { fontSize: 18, color: "#fff" },
  photoContainer: { height: 500 },
  photoWrapper: { width: SCREEN_WIDTH, height: 500, position: "relative" },
  photo: { width: "100%", height: "100%" },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  photoInfo: { position: "absolute", bottom: 20, left: 20 },
  name: { fontSize: 28, color: "#fff", marginBottom: 4 },
  location: { fontSize: 16, color: "#fff" },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    backgroundColor: "#fff",
  },
  bio: { fontSize: 16, lineHeight: 24, color: "#333" },
  sectionTitle: { fontSize: 18, marginBottom: 16, color: "#333" },
  hobbiesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  hobbyItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 20,
    gap: 8,
  },
  hobbyText: { fontSize: 14, color: "#333" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  passButton: { backgroundColor: "#fff" },
  likeButton: { backgroundColor: "#fff" },
  transitionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 32,
    fontWeight: "bold",
    color: "black",
  },
  logo: {
    width: 120,
    height: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: "white",
  },
});