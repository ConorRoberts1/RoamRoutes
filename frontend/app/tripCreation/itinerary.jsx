import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { BackgroundGradient } from "../../constants/globalStyles";
import { useLocalSearchParams } from "expo-router";
import { generateItinerary, regenerateActivity } from "../../utils/itineraryUtils";
import { saveItinerary } from "../../utils/firebaseUtils";

export default function Itinerary() {
  const { tripId, locationData: locationDataString } = useLocalSearchParams();
  const locationData = JSON.parse(locationDataString);
  const [itinerary, setItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch itinerary only once when the component mounts
  useEffect(() => {
    const fetchItinerary = async () => {
      setIsLoading(true);
      try {
        const generatedItinerary = await generateItinerary(
          locationData.name,
          locationData.groupSize || 1,
          locationData.spending
        );
        setItinerary(generatedItinerary);
      } catch (error) {
        console.error("Error generating itinerary:", error.message);
        Alert.alert("Error", "Failed to generate itinerary. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchItinerary();
  }, []); // Empty dependency array ensures this runs only once

  const handleSaveItinerary = async () => {
    try {
      await saveItinerary(tripId, locationData, itinerary);
      Alert.alert("Success", "Itinerary saved successfully!");
    } catch (error) {
      console.error("Error saving itinerary:", error.message);
      Alert.alert("Error", "Failed to save itinerary.");
    }
  };

  const handleRegenerateActivity = async (timeBlock) => {
    try {
      const newActivity = await regenerateActivity(
        timeBlock,
        locationData.name,
        locationData.groupSize || 1,
        locationData.spending
      );
      setItinerary((prev) => ({ ...prev, [timeBlock]: newActivity }));
    } catch (error) {
      console.error("Error regenerating activity:", error.message);
      Alert.alert("Error", "Failed to regenerate activity. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <BackgroundGradient>
        <View style={styles.container}>
          <Text style={styles.title}>Generating your itinerary...</Text>
        </View>
      </BackgroundGradient>
    );
  }

  if (!itinerary) {
    return (
      <BackgroundGradient>
        <View style={styles.container}>
          <Text style={styles.title}>Failed to generate itinerary.</Text>
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.title}>Your Itinerary</Text>
        <View style={styles.activityContainer}>
          <Text style={styles.subtitle}>Morning</Text>
          <Text style={styles.activityText}>{itinerary.morning}</Text>
          <TouchableOpacity style={styles.button} onPress={() => handleRegenerateActivity("morning")}>
            <Text style={styles.buttonText}>Regenerate Morning</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityContainer}>
          <Text style={styles.subtitle}>Afternoon</Text>
          <Text style={styles.activityText}>{itinerary.afternoon}</Text>
          <TouchableOpacity style={styles.button} onPress={() => handleRegenerateActivity("afternoon")}>
            <Text style={styles.buttonText}>Regenerate Afternoon</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.activityContainer}>
          <Text style={styles.subtitle}>Evening</Text>
          <Text style={styles.activityText}>{itinerary.evening}</Text>
          <TouchableOpacity style={styles.button} onPress={() => handleRegenerateActivity("evening")}>
            <Text style={styles.buttonText}>Regenerate Evening</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveItinerary}>
          <Text style={styles.buttonText}>Save Itinerary</Text>
        </TouchableOpacity>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
    marginBottom: 20,
  },
  activityContainer: {
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  activityText: {
    fontSize: 16,
    color: "black",
    marginBottom: 10,
  },
  button: {
    padding: 10,
    backgroundColor: "black",
    borderRadius: 10,
    marginTop: 10,
  },
  saveButton: {
    padding: 15,
    backgroundColor: "green",
    borderRadius: 15,
    marginTop: 20,
    width: "80%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
});