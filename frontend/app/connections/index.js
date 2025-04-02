import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { BackgroundGradient } from "../../constants/globalStyles"; // If you have a background component
import { fetchPotentialMatches, handleLike } from "../../utils/matchmakingUtils";
import { getAuth } from "firebase/auth";
import { useRouter } from "expo-router";

export default function Connections() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const results = await fetchPotentialMatches();
        setPotentialMatches(results);
      } catch (err) {
        console.error("Error fetching potential matches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  // If user passes, just skip this profile
  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  // If user "likes" -> call handleLike
  const handleUserLike = async () => {
    if (!potentialMatches[currentIndex]) return;
    const likedUserId = potentialMatches[currentIndex].userId;
    await handleLike(likedUserId);
    setCurrentIndex((prev) => prev + 1);
  };

  if (loading) {
    return (
      <BackgroundGradient>
        <View style={styles.container}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      </BackgroundGradient>
    );
  }

  // If we've gone through all matches
  if (currentIndex >= potentialMatches.length) {
    return (
      <BackgroundGradient>
        <View style={styles.container}>
          <Text style={styles.infoText}>No more matches available!</Text>
          <TouchableOpacity onPress={() => router.replace("/trips")} style={styles.backButton}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    );
  }

  // The user we are currently showing
  const userToShow = potentialMatches[currentIndex];
  const { profile } = userToShow;

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.heading}>Find New Connections</Text>

        <View style={styles.card}>
          {/* Display user's first image or a fallback */}
          <Image
            source={{ uri: profile.images?.[0] || "https://via.placeholder.com/150" }}
            style={styles.profileImage}
          />
          <Text style={styles.nameText}>Name: {profile.name || "Unknown"}</Text>
          <Text style={styles.ageText}>Age: {profile.age}</Text>
          <Text style={styles.infoText}>Hobbies: {profile.hobbies?.join(", ")}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={handlePass} style={[styles.button, styles.passButton]}>
            <Text style={styles.buttonText}>Pass</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUserLike} style={[styles.button, styles.likeButton]}>
            <Text style={styles.buttonText}>Like</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "black",
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  profileImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  nameText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  ageText: {
    fontSize: 16,
    color: "black",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: "black",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    padding: 15,
    borderRadius: 15,
    minWidth: 100,
    alignItems: "center",
  },
  passButton: {
    backgroundColor: "#ccc",
  },
  likeButton: {
    backgroundColor: "black",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
  },
  backButtonText: {
    color: "black",
    fontWeight: "bold",
  },
});
