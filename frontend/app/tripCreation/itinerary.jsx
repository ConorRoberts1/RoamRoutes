import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, 
  StyleSheet, Alert, Modal, FlatList 
} from 'react-native';
import { generateItinerary, regenerateActivity } from '../../utils/itineraryUtils';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BackgroundGradient } from '../../constants/globalStyles';
import { Linking } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import { Image } from 'expo-image';

const blurhash = "LGF5]+Yk^6#M@-5c,1J5@[or[Q6.";

export default function ItineraryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [savingItinerary, setSavingItinerary] = useState(false);

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
  }, []);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await generateItinerary(locationData, groupSize, budget);
      console.log("Generated Itinerary:", data);

      if (!data || data.length === 0) {
        throw new Error("No itinerary available for this location.");
      }

      setItinerary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveItineraryToFirebase = async () => {
    try {
      setSavingItinerary(true);
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("You must be logged in to save an itinerary");
      }
      
      const userId = user.uid;
      
      // Create a unique ID for this itinerary that includes the location name
      const sanitizedLocationName = locationData?.name?.replace(/[^a-zA-Z0-9]/g, "_") || "trip";
      const itineraryId = tripId || `${sanitizedLocationName}_${Date.now()}`;
      
      // Save the itinerary data with a proper name based on location
      const itineraryData = {
        location: locationData,
        name: locationData?.name || "My Trip", // Add a name property based on location
        activities: itinerary,
        createdAt: new Date().toISOString(),
        groupSize,
        budget,
      };
      
      // Save to the user's trips collection
      const itineraryDocRef = doc(firestore, `users/${userId}/trips`, itineraryId);
      await setDoc(itineraryDocRef, itineraryData);
      
      Alert.alert(
        "Success", 
        `Trip to ${locationData?.name || "destination"} saved successfully!`, 
        [{ text: "OK", onPress: () => router.push('/(tabs)/trips') }]
      );
    } catch (error) {
      console.error("Error saving itinerary:", error);
      Alert.alert("Error", error.message);
    } finally {
      setSavingItinerary(false);
    }
  };

  const showDescription = (activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const openGoogleMaps = (activities) => {
    if (!activities || activities.length === 0) {
      Alert.alert("No locations", "Itinerary does not contain valid locations.");
      return;
    }
    
    try {
      // Get the first activity's location for simple navigation
      const location = encodeURIComponent(activities[0].location);
      const googleMapsURL = `https://www.google.com/maps/search/?api=1&query=${location}`;
      
      Linking.openURL(googleMapsURL)
        .catch(err => {
          console.error('Error opening Google Maps:', err);
          Alert.alert('Error', 'Could not open Google Maps');
        });
    } catch (error) {
      console.error('Error preparing Google Maps URL:', error);
      Alert.alert('Error', 'Could not open Google Maps');
    }
  };

  const renderActivity = (activity, index) => (
    <TouchableOpacity key={activity.id || `${activity.time}-${index}`} onPress={() => showDescription(activity)}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {activity.photos && activity.photos.length > 0 ? (
            <Image 
              source={{ uri: activity.photos[0] }}
              style={styles.image}
              placeholder={blurhash}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
            />
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
            <Text style={styles.metaText}>
              ⭐ {activity.rating} ({activity.num_reviews} reviews)
            </Text>
            <Text style={styles.metaText}>💰 Price: {activity.price || "N/A"}</Text>
          </View>

          <TouchableOpacity onPress={() => openGoogleMaps([activity])} style={styles.mapsButton}>
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
          <ActivityIndicator size="large" color="#ffffff" />
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
          
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={saveItineraryToFirebase}
            disabled={savingItinerary}
          >
            <Text style={styles.acceptButtonText}>
              {savingItinerary ? "Saving..." : "Accept Itinerary"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.regenerateButton}
            onPress={loadItinerary}
          >
            <Text style={styles.regenerateButtonText}>Generate New Itinerary</Text>
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