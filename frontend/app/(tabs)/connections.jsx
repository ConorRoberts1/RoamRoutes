import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import * as Animatable from 'react-native-animatable';
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
  const [loadedImages, setLoadedImages] = useState({});
  const [isTransitioning, setIsTransitioning] = useState(false);

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

        setProfiles(fetched);
        fetched.forEach((profile) =>
          profile.images.forEach((img) => Image.prefetch(img))
        );
      } catch (err) {
        console.error("Error fetching user profiles:", err);
      }
    }

    loadProfiles();
  }, []);

  const profile = profiles[currentIndex];

  const onPass = async () => {
    setIsTransitioning(true);
    await handlePass(profile.userId);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 500);
  };

  const onLike = async () => {
    setIsTransitioning(true);
    await handleLike(profile.userId);
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 500);
  };

  const handleImageLoad = (key) => {
    setLoadedImages((prev) => ({ ...prev, [key]: true }));
  };

  if (!profile) {
    return (
      <BackgroundGradient>
        <View style={styles.noProfilesContainer}>
          <Text style={styles.noProfilesText}>No more profiles available.</Text>
        </View>
      </BackgroundGradient>
    );
  }

  if (isTransitioning) {
    return (
      <BackgroundGradient>
        <View style={styles.transitionContainer}>
          <Animatable.Text
            animation="pulse"
            iterationCount="infinite"
            duration={1000}
            style={styles.logoText}
          >
            RoamRoutes
          </Animatable.Text>
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
            {profile.images.map((photo, index) => {
              const key = `${profile.userId}_${index}`;
              return (
                <View key={index} style={styles.photoWrapper}>
                  {!loadedImages[key] && (
                    <View style={styles.photoPlaceholder}>
                      <ActivityIndicator size="large" color="#ffffff" />
                    </View>
                  )}
                  <Image
                    source={{ uri: photo }}
                    style={styles.photo}
                    resizeMode="cover"
                    onLoadEnd={() => handleImageLoad(key)}
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
              );
            })}
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
  photoPlaceholder: {
    position: "absolute",
    width: SCREEN_WIDTH,
    height: 500,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
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
});
