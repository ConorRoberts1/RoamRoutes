import { View, Text, Button, TouchableOpacity, Image, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function Trips() {
  const [step, setStep] = useState('initial');

  const handleBuildDreamTrip = () => {
    setStep('selectType');
  };

  const handleLoadPastTrips = () => {
    // Handle loading past trips
  };

  const handleSelectType = (type) => {
    // Handle the selection of trip type
    console.log(`Selected trip type: ${type}`);
  };

  const handleBack = () => {
    if (step === 'selectType') {
      setStep('initial');
    }
   
  };

  return (
    <View style={styles.container}>
      {step !== 'initial' && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}
      {step === 'initial' && (
        <>
          <Button title="Build dream trip" onPress={handleBuildDreamTrip} />
          <Button title="Load past trips" onPress={handleLoadPastTrips} />
        </>
      )}
      {step === 'selectType' && (
        <View style={styles.tripTypeContainer}>
          <TouchableOpacity style={styles.tripType} onPress={() => handleSelectType('adventure')}>
            <Image source={{ uri: 'https://example.com/adventure.jpg' }} style={styles.image} />
            <Text style={styles.tripTypeText}>Adventure</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tripType} onPress={() => handleSelectType('food')}>
            <Image source={{ uri: 'https://example.com/food.jpg' }} style={styles.image} />
            <Text style={styles.tripTypeText}>Food</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tripType} onPress={() => handleSelectType('sightseeing')}>
            <Image source={{ uri: 'https://example.com/sightseeing.jpg' }} style={styles.image} />
            <Text style={styles.tripTypeText}>Sightseeing</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10, 
    backgroundColor: 'white', 
    borderRadius: 20, 
  },
  tripTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  tripType: {
    alignItems: 'center',
    margin: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  tripTypeText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});