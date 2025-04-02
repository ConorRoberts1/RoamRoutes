import React, { useState, useEffect } from 'react';
import { 
  View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, 
  StyleSheet, Alert, Modal, FlatList 
} from 'react-native';
import { generateItinerary, regenerateActivity } from '../../utils/itineraryUtils';
import { useLocalSearchParams } from 'expo-router';
import { BackgroundGradient } from '../../constants/globalStyles';
import { Linking } from 'react-native';

export default function ItineraryScreen() {
  const params = useLocalSearchParams();
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  let locationData = {};
  try {
    locationData = params.locationData ? JSON.parse(params.locationData) : {};
  } catch (err) {
    console.error("Error parsing locationData:", err);
  }

  const location = locationData?.name || "Unknown";
  const groupSize = params.groupSize || 1;
  const budget = params.budget || "$";

  useEffect(() => {
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

  const openGoogleMaps = (activities) => {
    if (!activities || activities.length === 0) {
      Alert.alert("No locations", "Itinerary does not contain valid locations.");
      return;
    }
    const baseURL = "https://www.google.com/maps/dir/?api=1";
    const waypoints = activities.map(activity => encodeURIComponent(activity.location)).join("|");
    const googleMapsURL = `${baseURL}&waypoints=${waypoints}`;
    Linking.openURL(googleMapsURL);
  };

  const handleRegenerate = async (time) => {
    try {
      setRegenerating(time);
      const newActivity = await regenerateActivity(time, location, groupSize, budget);
      setItinerary(prev => prev.map(activity => 
        activity.time === time ? { ...newActivity, status: "pending" } : activity
      ));
    } catch (err) {
      Alert.alert("Regeneration Failed", err.message);
    } finally {
      setRegenerating(null);
    }
  };

  const showDescription = (activity) => {
    setSelectedActivity(activity);
    setModalVisible(true);
  };

  const renderActivity = (activity, index) => (
    <TouchableOpacity key={activity.id || `${activity.time}-${index}`} onPress={() => showDescription(activity)}>
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {activity.photos && activity.photos.length > 0 ? (
            <Image 
              source={{ uri: activity.photos[0] }} // Only display the first image for now
              style={styles.image}
              onError={(e) => console.error("Image Load Error:", e.nativeEvent.error)}
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
        </ScrollView>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 10 },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 10, marginBottom: 10 },
  imageContainer: { width: '100%', height: 150 },
  image: { width: '100%', height: '100%', borderRadius: 10 },
  details: { padding: 10 },
  title: { fontSize: 16, fontWeight: 'bold' },
  location: { fontSize: 14, color: 'gray' },
  metaText: { fontSize: 12, color: 'gray' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalDescription: { fontSize: 14, marginVertical: 10 },
  closeButton: { backgroundColor: '#FF5733', padding: 10, borderRadius: 5 },
  buttonText: { color: 'white', textAlign: 'center' },
});