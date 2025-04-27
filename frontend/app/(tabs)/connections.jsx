import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Image } from 'expo-image';
import * as Animatable from 'react-native-animatable';
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { Feather, Ionicons } from "@expo/vector-icons";
import { firestore } from "../../config/firebaseConfig";
import { BackgroundGradient } from "../../constants/globalStyles";
import { handleLike, handlePass, resetUserInteractions } from "../../utils/matchmakingUtils";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");
const blurhash = "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."; 

export default function Connections() {
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [interactedIds, setInteractedIds] = useState(new Set());
  const [displayStats, setDisplayStats] = useState({
    totalUsers: 0,
    filtered: 0,
    ageFiltered: 0,
    genderFiltered: 0,
    previouslyInteracted: 0,
  });
  
  const router = useRouter();
  
  // Load user profile and potential matches
  useEffect(() => {
    loadProfilesAndMatches();
  }, []);

  // Function to handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfilesAndMatches();
    setRefreshing(false);
  };

  // Calculate compatibility score between current user and potential match
  const calculateCompatibilityScore = (userProfile, otherProfile) => {
    let score = 0;
    
    // Calculate hobby match score - major component of compatibility
    const userHobbies = userProfile.hobbies || [];
    const otherHobbies = otherProfile.hobbies || [];
    
    if (userHobbies.length > 0 && otherHobbies.length > 0) {
      // Count matching hobbies
      const matchingHobbies = userHobbies.filter(hobby => 
        otherHobbies.includes(hobby)
      );
      
      // Calculate percentage of matching hobbies relative to user's total hobbies
      if (userHobbies.length > 0) {
        const percentMatch = matchingHobbies.length / userHobbies.length;
        // Give up to 70 points for hobby matches (weighted heavily)
        score += Math.round(percentMatch * 70);
        
        // Bonus points for having multiple matches
        if (matchingHobbies.length >= 3) {
          score += 10; // Bonus for 3+ matching hobbies
        }
      }
    }
    
    // Add points for language matches (secondary factor)
    const userLanguages = userProfile.languages || [];
    const otherLanguages = otherProfile.languages || [];
    
    if (userLanguages.length > 0 && otherLanguages.length > 0) {
      const matchingLanguages = userLanguages.filter(lang => 
        otherLanguages.includes(lang)
      );
      score += matchingLanguages.length * 5; // 5 points per matching language
    }
    
    // Age proximity bonus (up to 10 points)
    const userAge = parseInt(userProfile.age) || 25;
    const otherAge = parseInt(otherProfile.age) || 25;
    const ageDifference = Math.abs(userAge - otherAge);
    
    // Closer ages get more points (max 10 points for same age)
    if (ageDifference <= 10) {
      score += Math.round(10 - ageDifference);
    }
    
    return score;
  };

  // Main function to load everything
  const loadProfilesAndMatches = async () => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.warn("No user logged in, cannot load connections.");
      setIsInitialLoading(false);
      return;
    }
    
    const currentUserId = currentUser.uid;
    console.log("Loading profiles for user:", currentUserId);

    try {
      setIsInitialLoading(true);
      
      // First fetch the current user's profile to get preferences
      const userDocRef = doc(firestore, "users", currentUserId);
      const userDoc = await getDoc(userDocRef);
      const userProfile = userDoc.exists() ? userDoc.data().profile : null;
      
      if (!userProfile) {
        console.warn("User has no profile. Redirecting to profile creation.");
        Alert.alert(
          "Profile Required",
          "Please complete your profile to start matching with other travelers.",
          [{ text: "OK", onPress: () => router.push("/profile-creation") }]
        );
        setIsInitialLoading(false);
        return;
      }
      
      setCurrentUserProfile(userProfile);
      console.log("Current user preferences:", {
        ageRange: userProfile.ageRange || [18, 100],
        genderPreference: userProfile.genderPreference || [],
      });
      
      // Get previously interacted users
      const interactedUsers = await getUserInteractions(currentUserId);
      const interactedSet = new Set(interactedUsers);
      setInteractedIds(interactedSet);
      console.log(`Found ${interactedUsers.length} previous interactions`);
      
      // Get all users for filtering with detailed stats
      const allUsersSnapshot = await getDocs(collection(firestore, "users"));
      
      // Count stats
      const stats = {
        totalUsers: 0,
        filtered: 0,
        ageFiltered: 0,
        genderFiltered: 0,
        previouslyInteracted: 0,
      };
      
      const potentialMatches = [];
      
      allUsersSnapshot.forEach((docSnap) => {
        if (docSnap.id === currentUserId) return; // Skip current user
        
        const userData = docSnap.data();
        if (!userData.profile) return; // Skip users without profiles
        
        stats.totalUsers++;
        
        const userPrefs = userProfile || {};
        const ageRange = userPrefs.ageRange || [18, 100];
        const genderPref = userPrefs.genderPreference || [];
        
        // Required Filter 1: Age
        const otherUserAge = parseInt(userData.profile.age || 0);
        if (otherUserAge < ageRange[0] || otherUserAge > ageRange[1]) {
          stats.ageFiltered++;
          return;
        }
        
        // Required Filter 2: Gender
        if (genderPref.length > 0) {
          const otherUserGender = userData.profile.gender || "";
          if (!genderPref.includes(otherUserGender)) {
            stats.genderFiltered++;
            return;
          }
        }
        
        // Required Filter 3: Previous interactions
        if (interactedSet.has(docSnap.id)) {
          stats.previouslyInteracted++;
          return;
        }
        
        // User passed all required filters
        stats.filtered++;
        
        // Only add users with images
        if (userData.profile.images && userData.profile.images.length > 0) {
          // Calculate compatibility score for sorting
          const compatibilityScore = calculateCompatibilityScore(userProfile, userData.profile);
          
          potentialMatches.push({
            userId: docSnap.id,
            compatibilityScore,
            name: userData.profile.name || "Unnamed",
            age: userData.profile.age || 18,
            location: userData.profile.location || "Unknown",
            gender: userData.profile.gender || "Not specified",
            images: userData.profile.images,
            hobbies: userData.profile.hobbies || [],
            languages: userData.profile.languages || [],
          });
        }
      });
      
      setDisplayStats(stats);
      console.log("Filtering stats:", stats);
      
      // Pre-warm the image cache
      if (potentialMatches.length > 0) {
        const allImageUrls = potentialMatches.flatMap(profile => profile.images);
        Image.prefetch(allImageUrls);
      }
      
      // Sort by compatibility score (higher scores first)
      potentialMatches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
      
      console.log(`Found ${potentialMatches.length} potential matches after filtering`);
      if (potentialMatches.length > 0) {
        console.log(`Top match has compatibility score: ${potentialMatches[0].compatibilityScore}`);
        console.log(`Compatibility range: ${potentialMatches[potentialMatches.length-1].compatibilityScore} to ${potentialMatches[0].compatibilityScore}`);
      }
      
      setProfiles(potentialMatches);
      setCurrentIndex(0);
      
    } catch (err) {
      console.error("Error fetching user profiles:", err);
      Alert.alert("Error", "There was a problem loading profiles. Please try again.");
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Helper function to get user's previous interactions
  const getUserInteractions = async (userId) => {
    try {
      const [likedDocs, matchedDocs, passedDocs, unmatchedDocs] = await Promise.all([
        getDocs(collection(firestore, `users/${userId}/likes`)),
        getDocs(collection(firestore, `users/${userId}/matches`)),
        getDocs(collection(firestore, `users/${userId}/passes`)),
        getDocs(collection(firestore, `users/${userId}/unmatched`))
      ]);
      
      return [
        ...likedDocs.docs.map(doc => doc.id),
        ...matchedDocs.docs.map(doc => doc.id),
        ...passedDocs.docs.map(doc => doc.id),
        ...unmatchedDocs.docs.map(doc => doc.id)
      ];
    } catch (error) {
      console.error("Error getting user interactions:", error);
      return [];
    }
  };

  const profile = profiles[currentIndex];

  const onPass = async () => {
    if (!profile) return;
    
    setIsTransitioning(true);
    try {
      await handlePass(profile.userId);
      // Add to interacted set
      setInteractedIds(prev => new Set([...prev, profile.userId]));
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
      // Add to interacted set
      setInteractedIds(prev => new Set([...prev, profile.userId]));
    } catch (error) {
      console.error("Error handling like:", error);
    }
    
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 500);
  };
  
  const handleResetInteractions = async () => {
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      
      Alert.alert(
        "Reset Interactions",
        "This will clear your likes, passes, and matches. This action cannot be undone. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Reset", 
            style: "destructive",
            onPress: async () => {
              setIsInitialLoading(true);
              await resetUserInteractions(userId);
              setInteractedIds(new Set());
              await loadProfilesAndMatches();
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error resetting interactions:", error);
      Alert.alert("Error", "Failed to reset interactions. Please try again.");
    }
  };

  // Show loading state during initial data fetch
  if (isInitialLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Finding your perfect matches...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  // No matches - show info and options
  if (!profile) {
    return (
      <BackgroundGradient>
        <ScrollView 
          contentContainerStyle={styles.noProfilesContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          <Animatable.View animation="fadeIn" style={styles.noMatchesCard}>
            <Ionicons name="heart-dislike-outline" size={60} color="#fff" style={styles.noMatchesIcon} />
            <Text style={styles.noProfilesTitle}>No Matches Found</Text>
            <Text style={styles.noProfilesText}>
              We couldn't find any matches based on your current preferences.
            </Text>
            
            {displayStats.totalUsers > 0 && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Why am I not seeing matches?</Text>
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Total other users:</Text>
                  <Text style={styles.statValue}>{displayStats.totalUsers}</Text>
                </View>
                
                {displayStats.ageFiltered > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Filtered by age:</Text>
                    <Text style={styles.statValue}>{displayStats.ageFiltered}</Text>
                  </View>
                )}
                
                {displayStats.genderFiltered > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Filtered by gender:</Text>
                    <Text style={styles.statValue}>{displayStats.genderFiltered}</Text>
                  </View>
                )}
                
                {displayStats.previouslyInteracted > 0 && (
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Previously interacted:</Text>
                    <Text style={styles.statValue}>{displayStats.previouslyInteracted}</Text>
                  </View>
                )}
                
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Remaining matches:</Text>
                  <Text style={styles.statValue}>{displayStats.filtered}</Text>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.editPrefsButton}
              onPress={() => router.push("/profile-creation")}
            >
              <Text style={styles.editPrefsButtonText}>Update Your Preferences</Text>
            </TouchableOpacity>
      
          </Animatable.View>
        </ScrollView>
      </BackgroundGradient>
    );
  }

  // Transition between profiles
  if (isTransitioning) {
    return (
      <BackgroundGradient>
        <View style={styles.transitionContainer}>
          <Animatable.Image
            animation="pulse" 
            iterationCount="infinite"
            source={require('../../assets/images/logo.png')} 
            duration={1000}
            style={styles.logo}
          />
        </View>
      </BackgroundGradient>
    );
  }

  // Get matching hobbies for visual highlighting
  const matchingHobbies = (currentUserProfile?.hobbies || []).filter(
    hobby => profile.hobbies.includes(hobby)
  );
  const matchingLanguages = (currentUserProfile?.languages || []).filter(
    lang => profile.languages.includes(lang)
  );

  // Compatibility label based on score
  const getCompatibilityLabel = (score) => {
    if (score >= 70) return "Perfect Match!";
    if (score >= 50) return "Great Match!";
    if (score >= 30) return "Good Match";
    if (score >= 15) return "Match";
    return "New Profile";
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Photo carousel */}
          <View style={styles.photoContainer}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
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
                </View>
              ))}
            </ScrollView>
            
            {/* Photo pagination dots */}
            <View style={styles.paginationContainer}>
              {profile.images.map((_, index) => (
                <View 
                  key={index} 
                  style={[styles.paginationDot, index === 0 && styles.activeDot]} 
                />
              ))}
            </View>
            
            {/* Compatibility Badge */}
            {profile.compatibilityScore > 0 && (
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityLabel}>
                  {getCompatibilityLabel(profile.compatibilityScore)}
                </Text>
                <View style={styles.starsContainer}>
                  {Array(5).fill(0).map((_, i) => (
                    <Ionicons 
                      key={i} 
                      name={i < Math.ceil(profile.compatibilityScore/20) ? "star" : "star-outline"} 
                      size={14} 
                      color="#FFD700"
                      style={{marginHorizontal: 1}}
                    />
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.photoInfo}>
              <Text style={styles.name}>
                {profile.name}, {profile.age}
              </Text>
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={16} color="#fff" />
                {" "}{profile.location}
              </Text>
            </View>
          </View>

          {/* Profile info cards */}
          <View style={styles.infoContainer}>
            
            {/* Gender section */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Gender</Text>
              <View style={styles.tagContainer}>
                <View style={styles.genderTag}>
                  <Text style={styles.genderTagText}>{profile.gender}</Text>
                </View>
              </View>
            </View>

            {/* Languages section */}
            {profile.languages && profile.languages.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Languages</Text>
                <View style={styles.tagContainer}>
                  {profile.languages.map((language, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.languageTag,
                        matchingLanguages.includes(language) && styles.matchedTag
                      ]}
                    >
                      <Text 
                        style={[
                          styles.languageTagText,
                          matchingLanguages.includes(language) && styles.matchedTagText
                        ]}
                      >
                        {language}
                        {matchingLanguages.includes(language) && " ✓"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Interests section */}
            {profile.hobbies && profile.hobbies.length > 0 && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                  Interests
                  {matchingHobbies.length > 0 && (
                    <Text style={styles.sharedInterestsLabel}>
                      {" "}({matchingHobbies.length} shared)
                    </Text>
                  )}
                </Text>
                <View style={styles.tagContainer}>
                  {profile.hobbies.map((hobby, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.hobbyTag,
                        matchingHobbies.includes(hobby) && styles.matchedTag
                      ]}
                    >
                      <Text 
                        style={[
                          styles.hobbyTagText,
                          matchingHobbies.includes(hobby) && styles.matchedTagText
                        ]}
                      >
                        {hobby}
                        {matchingHobbies.includes(hobby) && " ✓"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actionButtonsContainer}>
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
            <Feather name="heart" size={32} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: "white",
    textAlign: "center",
  },
  // No profiles styles
  noProfilesContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noMatchesCard: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 20,
    padding: 25,
    width: "100%",
    alignItems: "center",
  },
  noMatchesIcon: {
    marginBottom: 15,
  },
  noProfilesTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  noProfilesText: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
  },
  statsContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statLabel: {
    color: "#fff",
    fontSize: 14,
  },
  statValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  editPrefsButton: {
    backgroundColor: "#4A69FF",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 10,
    width: "100%",
  },
  editPrefsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Transition styles
  transitionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
  },
  // Photo carousel styles
  photoContainer: {
    height: height * 0.6,
    position: "relative",
  },
  photoScroll: {
    height: "100%",
  },
  photoWrapper: {
    width,
    height: "100%",
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
  paginationContainer: {
    position: "absolute",
    top: 15,
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: "#fff",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  // Compatibility badge
  compatibilityBadge: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "column",
    alignItems: "center",
  },
  compatibilityLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 2,
  },
  starsContainer: {
    flexDirection: "row",
  },
  photoInfo: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
  },
  name: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  location: {
    fontSize: 18,
    color: "#fff",
    flexDirection: "row",
    alignItems: "center",
  },
  // Profile info cards styles
  infoContainer: {
    padding: 15,
    paddingBottom: 100, // Space for action buttons
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  sharedInterestsLabel: {
    fontSize: 14,
    fontWeight: "normal",
    color: "#4CAF50",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  genderTag: {
    backgroundColor: "#E3F2FD",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  genderTagText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "500",
  },
  languageTag: {
    backgroundColor: "#FFF8E1",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  languageTagText: {
    color: "#FFA000",
    fontSize: 14,
    fontWeight: "500",
  },
  hobbyTag: {
    backgroundColor: "#F3E5F5",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  hobbyTagText: {
    color: "#7B1FA2",
    fontSize: 14,
    fontWeight: "500",
  },
  matchedTag: {
    borderWidth: 1.5,
    borderColor: "#4CAF50",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  matchedTagText: {
    fontWeight: "bold",
    color: "#4CAF50",
  },
  // Action buttons styles
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
  },
  actionButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  passButton: {
    backgroundColor: "white",
  },
  likeButton: {
    backgroundColor: "white",
  },
});