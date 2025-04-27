import 'react-native-get-random-values';
import { View, StyleSheet, Alert } from 'react-native';
import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { BackgroundGradient } from '../../constants/globalStyles';
import * as Animatable from 'react-native-animatable';
import { createTrip, addLocationToTrip } from '../../utils/firebaseUtils';

export default function searchFill() {
  const router = useRouter();

  const handleLocationSelect = async (data, details) => {
    console.log("handleLocationSelect called");
    if (!details) {
      console.log("No details available");
      Alert.alert("Error", "No details available for the selected location.");
      return;
    }
  
    const locationData = {
      place_id: data.place_id,
      name: data.structured_formatting.main_text || "",
      address: data.description || "",  // Use full description as fallback
      latitude: details.geometry?.location?.lat || 0,
      longitude: details.geometry?.location?.lng || 0,
      rating: details.rating || 0,
      user_ratings_total: details.user_ratings_total || 0,
      types: details.types || [],
      spendingRange: { min: 0, max: 20 }, // Default spending range (adjust as needed)
    };
  
    try {
      const tripId = `trip_${Date.now()}`;
      await createTrip(tripId, `My Trip to ${locationData.name}`);
      await addLocationToTrip(tripId, locationData);
  
      // Pass locationData properly as JSON string
      router.push({
        pathname: "/tripCreation/spending",
        params: { tripId, locationData: JSON.stringify(locationData) },
      });
    } catch (error) {
      console.log("Error saving location:", error.message);
      Alert.alert("Error", error.message);
    }
  };
  
  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Animatable.Text
          animation="fadeIn"
          duration={1000}
          style={styles.title}
          delay={0}
        >
          Enter a Location
        </Animatable.Text>
        <GooglePlacesAutocomplete
          placeholder="Search"
          fetchDetails={true}
          onPress={handleLocationSelect}
          query={{
            key: process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY,
            language: 'en',
          }}
          styles={{
            textInputContainer: styles.textInputContainer,
            textInput: styles.textInput,
            predefinedPlacesDescription: styles.predefinedPlacesDescription,
          }}
        />
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 175,
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'black',
    marginBottom: 20,
  },
  textInputContainer: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    height: 50,
    color: '#5d5d5d',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 15,
    paddingLeft: 10,
  },
  predefinedPlacesDescription: {
    color: '#1faadb',
  },
});