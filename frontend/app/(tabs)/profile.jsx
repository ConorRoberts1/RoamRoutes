import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Image, ScrollView } from "react-native";
import { BackgroundGradient } from "../../constants/globalStyles";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth, firestore } from "../../config/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function Profile() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get the current user
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        // Get the user's profile from Firestore
        const userId = user.uid;
        const userDocRef = doc(firestore, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists() && userDoc.data().profile) {
          setProfile(userDoc.data().profile);
        } else {
          console.log("No profile data found");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        Alert.alert("Success", "Logged out successfully!");
        router.replace("/auth/sign-in");
      })
      .catch((error) => {
        Alert.alert("Error", error.message);
      });
  };

  const handleEditProfile = () => {
    router.push("/profile-creation");
  };

  if (loading) {
    return (
      <BackgroundGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  if (!profile) {
    return (
      <BackgroundGradient>
        <View style={styles.noProfileContainer}>
          <Text style={styles.noProfileText}>No profile found</Text>
          <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
            <Text style={styles.buttonText}>Create Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>{profile.name || "My Profile"}</Text>
          
          {profile.images && profile.images.length > 0 && (
            <View style={styles.imageContainer}>
              {profile.images.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.profileImage} />
              ))}
            </View>
          )}
          
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Age</Text>
            <Text style={styles.infoValue}>{profile.age}</Text>
          </View>
          
          {/* Added Gender field */}
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Gender</Text>
            <Text style={styles.infoValue}>
              {profile.gender || "Not specified"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Interests</Text>
            <Text style={styles.infoValue}>
              {profile.hobbies && profile.hobbies.length > 0 
                ? profile.hobbies.join(", ") 
                : "None specified"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Languages</Text>
            <Text style={styles.infoValue}>
              {profile.languages && profile.languages.length > 0 
                ? profile.languages.join(", ") 
                : "None specified"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Preferred Age Range</Text>
            <Text style={styles.infoValue}>
              {profile.ageRange 
                ? `${Math.round(profile.ageRange[0])} - ${Math.round(profile.ageRange[1])}` 
                : "Not specified"}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Gender Preference</Text>
            <Text style={styles.infoValue}>
              {profile.genderPreference && profile.genderPreference.length > 0 
                ? profile.genderPreference.join(", ") 
                : "None specified"}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.button} onPress={handleEditProfile}>
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    paddingTop: 50,
    paddingBottom: 50,
    alignItems: "center",
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
  noProfileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  noProfileText: {
    fontSize: 18,
    marginBottom: 20,
    color: "#333",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
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
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 16,
    color: "#555",
  },
  button: {
    padding: 15,
    backgroundColor: "black",
    borderRadius: 15,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
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
    fontWeight: "bold",
    fontSize: 18,
  },
  logoutButton: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 15,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  logoutButtonText: {
    color: "#666",
    fontSize: 16,
  },
});