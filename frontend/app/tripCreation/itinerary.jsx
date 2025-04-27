import React, { useState, useEffect } from 'react';
import {  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { generateItinerary } from '../../utils/itineraryUtils';
import { BackgroundGradient } from '../../constants/globalStyles';
import { Linking } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import { Image } from 'expo-image';

const blurhash = "LGF5]+Yk^6#M@-5c,1J5@[or[Q6.";

export default function ItineraryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingItinerary, setSavingItinerary] = useState(false);
  const [userHobbies, setUserHobbies] = useState([]);
  const [regeneratingItinerary, setRegeneratingItinerary] = useState(false);

  let locationData = {};
  try {
    locationData = params.locationData ? JSON.parse(params.locationData) : {};
  } catch (err) {
    console.error("Error parsing locationData:", err);
  }

  const location = locationData?.name || "Unknown";
  const groupSize = params.groupSize || 1;
  const budget = params.spending || "$";
  const tripId = params.tripId;

  useEffect(() => {
    const fetchUserHobbies = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists() && userDoc.data()?.profile?.hobbies) {
          setUserHobbies(userDoc.data().profile.hobbies);
        }
      } catch (error) {
        console.error("Error fetching user hobbies:", error);
      }
    };
    fetchUserHobbies();
  }, []);

  useEffect(() => {
    const savedActivitiesString = params.savedActivities;
    if (savedActivitiesString) {
      try {
        const parsedActivities = JSON.parse(savedActivitiesString);
        if (Array.isArray(parsedActivities) && parsedActivities.length > 0) {
          setItinerary(parsedActivities);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error parsing saved activities:", err);
      }
    }
    loadItinerary();
  }, [userHobbies]);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      // Pass locationData directly to use activityPreferences if they exist
      const data = await generateItinerary(locationData, groupSize, budget, locationData.activityPreferences);
      if (!data || data.length === 0) throw new Error("No itinerary available for this location.");
      setItinerary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerateItinerary = async () => {
    try {
      setRegeneratingItinerary(true);
      setError(null);
      const currentIds = itinerary.map(item => item.id || `${item.time}-${item.title}`);
      let attempts = 0;
      let newItinerary;
      while (attempts < 3) {
        attempts++;
        newItinerary = await generateItinerary(locationData, groupSize, budget, locationData.activityPreferences);
        if (!newItinerary || newItinerary.length === 0) throw new Error("No itinerary available.");
        const newIds = newItinerary.map(item => item.id || `${item.time}-${item.title}`);
        const different = newIds.filter(id => !currentIds.includes(id)).length;
        if (different >= 2) break;
      }
      setItinerary(newItinerary);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegeneratingItinerary(false);
    }
  };

  const saveItineraryToFirebase = async () => {
    try {
      setSavingItinerary(true);
      
      // Check user authentication
      const user = getAuth().currentUser;
      if (!user) {
        throw new Error("You must be logged in to save an itinerary");
      }
      
      // Validate required data
      if (!location) {
        throw new Error("Location data is missing");
      }
      
      if (!itinerary || itinerary.length === 0) {
        throw new Error("No activities to save in itinerary");
      }
      
      const userId = user.uid;
      const sanitizedName = location.replace(/[^a-zA-Z0-9]/g, "_");
      const itineraryId = tripId || `${sanitizedName}_${Date.now()}`;
      
      // Clean up the itinerary data to ensure no undefined values
      const cleanedItinerary = itinerary.map(activity => {
        const cleanActivity = {};
        
        // Process each key in the activity object
        Object.keys(activity).forEach(key => {
          // Skip undefined values
          if (activity[key] !== undefined) {
            cleanActivity[key] = activity[key];
          } else {
            // Replace undefined with appropriate default value
            switch (key) {
              case 'photos':
                cleanActivity[key] = [];
                break;
              case 'rating':
              case 'num_reviews':
                cleanActivity[key] = 0;
                break;
              case 'price':
                cleanActivity[key] = 'N/A';
                break;
              default:
                cleanActivity[key] = null;
            }
          }
        });
        
        return cleanActivity;
      });
      
      // Clean location data
      const cleanLocationData = {};
      if (locationData) {
        Object.keys(locationData).forEach(key => {
          if (locationData[key] !== undefined) {
            cleanLocationData[key] = locationData[key];
          }
        });
      }
      
      console.log(`Saving itinerary for ${location} with ${cleanedItinerary.length} activities`);
      
      const itineraryData = {
        location: cleanLocationData,
        name: location,
        activities: cleanedItinerary,
        createdAt: new Date().toISOString(),
        groupSize: Number(groupSize) || 1,
        budget: budget || "$",
      };
      
      // Reference to document
      const docRef = doc(firestore, `users/${userId}/trips`, itineraryId);
      
      // Save to Firestore
      await setDoc(docRef, itineraryData);
      console.log("Itinerary saved successfully with ID:", itineraryId);
      
      Alert.alert(
        "Success", 
        `Trip to ${location} saved!`, 
        [
          { 
            text: "OK", 
            onPress: () => router.push("/(tabs)/trips") 
          }
        ]
      );
    } catch (error) {
      console.error("Error saving itinerary:", error);
      
      // Create a user-friendly error message
      let errorMessage = "Failed to save your itinerary.";
      
      if (error.message) {
        if (error.message.includes("permission-denied") || error.message.includes("Permission denied")) {
          errorMessage = "You don't have permission to save this itinerary. Please sign in again.";
        } else if (error.message.includes("network")) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes("quota")) {
          errorMessage = "Server busy. Please try again later.";
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        "Error", 
        errorMessage,
        [
          {
            text: "Try Again",
            onPress: () => saveItineraryToFirebase()
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ]
      );
    } finally {
      setSavingItinerary(false);
    }
  };

  const openGoogleMaps = (location) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
    Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open Google Maps"));
  };

  const renderActivity = (activity, index) => (
    <TouchableOpacity key={activity.id || `${activity.time}-${index}`} onPress={() => openGoogleMaps(activity.location)}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {activity.photos?.[0] ? (
            <Image source={{ uri: activity.photos[0] }} style={styles.image} placeholder={blurhash} contentFit="cover" transition={300} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image Available</Text>
            </View>
          )}
        </View>
        <View style={styles.details}>
          <Text style={styles.time}>{activity.time}</Text>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.location}>{activity.location}</Text>
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>⭐ {activity.rating ?? 'N/A'} ({activity.num_reviews ?? 0} reviews)</Text>
            <Text style={styles.metaText}>💰 Price: {activity.price || "N/A"}</Text>
          </View>
          <TouchableOpacity onPress={() => openGoogleMaps(activity.location)} style={styles.mapsButton}>
            <Text style={styles.buttonText}>📍 Open in Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <BackgroundGradient>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Crafting your perfect day...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  if (error) {
    return (
      <BackgroundGradient>
        <View style={styles.center}>
          <Text style={styles.errorHeading}>Oops! Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadItinerary} style={styles.retryButton}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.sectionTitle}>🌅 Morning</Text>
          {itinerary.filter(a => a.time.includes("Morning")).map(renderActivity)}

          <Text style={styles.sectionTitle}>☀️ Afternoon</Text>
          {itinerary.filter(a => a.time.includes("Afternoon")).map(renderActivity)}

          <Text style={styles.sectionTitle}>🌙 Evening</Text>
          {itinerary.filter(a => a.time.includes("Evening")).map(renderActivity)}

          <TouchableOpacity style={styles.acceptButton} onPress={saveItineraryToFirebase} disabled={savingItinerary}>
            <Text style={styles.acceptButtonText}>
              {savingItinerary ? "Saving..." : "Accept Itinerary"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.regenerateButton} onPress={regeneratingItinerary ? null : regenerateItinerary} disabled={regeneratingItinerary}>
            <Text style={styles.regenerateButtonText}>
              {regeneratingItinerary ? "Finding New Options..." : "Generate New Itinerary"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </BackgroundGradient>
  );
}


const styles = StyleSheet.create({
  container: { padding: 20 },
  scrollContainer: { paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 10 },
  imageContainer: { width: '100%', height: 150 },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  placeholderImage: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 10,
    backgroundColor: '#e0e0e0', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  placeholderText: { color: '#666' },
  details: { padding: 10 },
  time: { fontSize: 14, color: '#666', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: 'bold' },
  location: { fontSize: 14, color: 'gray', marginBottom: 8 },
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  metaText: { fontSize: 12, color: 'gray' },
  mapsButton: { 
    backgroundColor: '#4285F4', 
    padding: 8, 
    borderRadius: 5, 
    alignItems: 'center' 
  },
  buttonText: { color: 'white', fontWeight: '500' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: { color: 'black', marginTop: 12, fontSize: 16 },
  errorHeading: { fontSize: 18, fontWeight: 'bold', color: 'red', marginBottom: 10 },
  errorText: { textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: 'black', padding: 10, borderRadius: 10 },
  retryText: { color: 'white' },
  acceptButton: {
    backgroundColor: 'black',
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
    alignItems: 'center'
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  regenerateButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'black',
    alignItems: 'center'
  },
  regenerateButtonText: {
    color: 'black',
    fontSize: 16
  }
});