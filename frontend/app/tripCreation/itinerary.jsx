import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { generateItinerary, regenerateActivity } from '../../utils/itineraryUtils';
import { useLocalSearchParams } from 'expo-router';
import { BackgroundGradient } from '../../constants/globalStyles';

export default function ItineraryScreen() {
  const params = useLocalSearchParams();
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(null);

  useEffect(() => {
    loadItinerary();
  }, []);

  const loadItinerary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await generateItinerary(
        params.location,
        params.groupSize,
        params.budget
      );
      setItinerary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (time) => {
    try {
      setRegenerating(time);
      const newActivity = await regenerateActivity(
        time,
        params.location,
        params.groupSize,
        params.budget
      );
      
      setItinerary(prev => 
        prev.map(activity => 
          activity.time === time ? { ...newActivity, status: "pending" } : activity
        )
      );
      
      // Re-enrich with TripAdvisor data
      const enriched = await enrichWithTripAdvisor([newActivity]);
      setItinerary(prev => 
        prev.map(activity => 
          activity.time === time ? enriched[0] : activity
        )
      );
    } catch (err) {
      Alert.alert("Regeneration Failed", err.message);
    } finally {
      setRegenerating(null);
    }
  };

  const renderActivity = (activity) => (
    <View key={activity.time} style={styles.card}>
      <View style={styles.imageContainer}>
        {activity.image ? (
          <Image source={{ uri: activity.image }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
      </View>

      <View style={styles.details}>
        <Text style={styles.time}>{activity.time}</Text>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.location}>{activity.location}</Text>

        {activity.status === "error" && (
          <Text style={styles.errorText}>{activity.error || "Error loading details"}</Text>
        )}

        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Rating: {activity.rating}</Text>
          <Text style={styles.metaText}>Price: {activity.price}</Text>
        </View>

        <TouchableOpacity 
          onPress={() => handleRegenerate(activity.time)}
          style={styles.regenerateButton}
          disabled={regenerating === activity.time}
        >
          {regenerating === activity.time ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>⟳ Regenerate</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
      <ScrollView contentContainerStyle={styles.container}>
        {itinerary.map(renderActivity)}
      </ScrollView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    marginBottom: 20,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  imageContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    padding: 15,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 3,
  },
  location: {
    fontSize: 14,
    color: '#636e72',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 10,
  },
  metaText: {
    fontSize: 14,
    color: '#2d3436',
  },
  regenerateButton: {
    backgroundColor: '#0984e3',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: 'white',
    marginTop: 15,
    fontSize: 16,
  },
  errorHeading: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  errorText: {
    color: '#ff7675',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00b894',
    padding: 15,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '500',
  },
});