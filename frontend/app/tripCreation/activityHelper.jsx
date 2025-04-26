import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import { BackgroundGradient } from "../../constants/globalStyles";
import * as Animatable from 'react-native-animatable';

export default function ActivityHelper() {
  const router = useRouter();
  const { tripId, locationData: locationDataString } = useLocalSearchParams();
  const [preferences, setPreferences] = useState({
    morning: [],
    afternoon: [],
    evening: []
  });
  
  let locationData = {};
  try {
    locationData = JSON.parse(locationDataString);
  } catch (error) {
    console.error("Error parsing location data:", error);
  }

  // Activity types by time of day
  const activityOptions = {
    morning: [
      { id: 'food', label: 'Breakfast & Cafés', icon: '☕' },
      { id: 'cultural', label: 'Cultural Sites', icon: '🏛️' },
      { id: 'outdoors', label: 'Parks & Nature', icon: '🌳' },
      { id: 'shopping', label: 'Local Markets', icon: '🛒' },
      { id: 'tours', label: 'Morning Tours', icon: '🧭' }
    ],
    afternoon: [
      { id: 'food', label: 'Local Cuisine', icon: '🍽️' },
      { id: 'museums', label: 'Museums & Galleries', icon: '🖼️' },
      { id: 'active', label: 'Active Experiences', icon: '🚴' },
      { id: 'landmarks', label: 'Landmarks', icon: '🗿' },
      { id: 'relaxation', label: 'Relaxation', icon: '🧘' }
    ],
    evening: [
      { id: 'food', label: 'Dining Experience', icon: '🍷' },
      { id: 'entertainment', label: 'Shows & Entertainment', icon: '🎭' },
      { id: 'nightlife', label: 'Nightlife', icon: '🌃' },
      { id: 'scenic', label: 'Scenic Views', icon: '🌅' },
      { id: 'local', label: 'Local Experience', icon: '🎉' }
    ]
  };

  const togglePreference = (timeOfDay, activityId) => {
    setPreferences(prev => {
      const currentPrefs = [...prev[timeOfDay]];
      
      if (currentPrefs.includes(activityId)) {
        // Remove if already selected
        return {
          ...prev,
          [timeOfDay]: currentPrefs.filter(id => id !== activityId)
        };
      } else {
        // Add if not already selected, but limit to max 2 selections per time period
        if (currentPrefs.length < 2) {
          return {
            ...prev,
            [timeOfDay]: [...currentPrefs, activityId]
          };
        }
        return prev; // Already have 2 selections
      }
    });
  };

  const handleContinue = () => {
    // Convert preferences to activity type strings
    const activityTypes = {
      morning: preferences.morning.map(id => 
        activityOptions.morning.find(opt => opt.id === id)?.label || ''),
      afternoon: preferences.afternoon.map(id => 
        activityOptions.afternoon.find(opt => opt.id === id)?.label || ''),
      evening: preferences.evening.map(id => 
        activityOptions.evening.find(opt => opt.id === id)?.label || '')
    };

    // Add preferences to location data
    const updatedLocationData = {
      ...locationData,
      activityPreferences: activityTypes
    };

    // Navigate to the itinerary page with the updated data
    router.push({
      pathname: "/tripCreation/itinerary",
      params: {
        tripId,
        locationData: JSON.stringify(updatedLocationData),
        groupSize: locationData.groupSize || 2,
        spending: locationData.spending || "$"
      }
    });
  };

  const renderActivityOptions = (timeOfDay) => {
    return (
      <View style={styles.optionsContainer}>
        {activityOptions[timeOfDay].map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.activityOption,
              preferences[timeOfDay].includes(activity.id) && styles.selectedOption
            ]}
            onPress={() => togglePreference(timeOfDay, activity.id)}
          >
            <Text style={styles.activityIcon}>{activity.icon}</Text>
            <Text 
              style={[
                styles.activityLabel,
                preferences[timeOfDay].includes(activity.id) && styles.selectedLabel
              ]}
            >
              {activity.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <BackgroundGradient>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Animatable.Text 
            animation="fadeInDown" 
            style={styles.title}
          >
            Customize Your Day
          </Animatable.Text>
          
          <Text style={styles.subtitle}>Choose up to 2 preferences for each time of day</Text>
          
          <Animatable.View animation="fadeIn" delay={200}>
            <Text style={styles.timeLabel}>Morning Activities</Text>
            {renderActivityOptions('morning')}
          </Animatable.View>
          
          <Animatable.View animation="fadeIn" delay={400}>
            <Text style={styles.timeLabel}>Afternoon Activities</Text>
            {renderActivityOptions('afternoon')}
          </Animatable.View>
          
          <Animatable.View animation="fadeIn" delay={600}>
            <Text style={styles.timeLabel}>Evening Activities</Text>
            {renderActivityOptions('evening')}
          </Animatable.View>
          
          <Animatable.View animation="fadeIn" delay={800}>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={handleContinue}
            >
              <Text style={styles.buttonText}>Create Itinerary</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={handleContinue}
            >
              <Text style={styles.skipButtonText}>Skip and use default suggestions</Text>
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#333",
    marginBottom: 30
  },
  timeLabel: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 15,
    color: "#333"
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10
  },
  activityOption: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3
  },
  selectedOption: {
    backgroundColor: '#4285F4',
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 10
  },
  activityLabel: {
    fontSize: 16,
    color: "#333",
    flexShrink: 1
  },
  selectedLabel: {
    color: "white",
    fontWeight: "bold"
  },
  continueButton: {
    backgroundColor: "black",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 30
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold"
  },
  skipButton: {
    padding: 15,
    alignItems: "center",
    marginTop: 15
  },
  skipButtonText: {
    color: "#333",
    fontSize: 16
  }
});