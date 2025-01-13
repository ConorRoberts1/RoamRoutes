import { View, Text, Button, TouchableOpacity, Image, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import sightseeingImage from '../../assets/images/sightseeing.jpg';
import { BackgroundGradient } from '../../constants/globalStyles'; 
import { useNavigation, useRouter } from 'expo-router';

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

  const router = useRouter();

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        {step !== 'initial' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        )}
        {step === 'initial' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/tripCreation/searchFill')}>
              <Text style={styles.buttonText}>Build dream trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleLoadPastTrips}>
              <Text style={styles.buttonText}>Load past trips</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* {step === 'selectType' && (
          <View style={styles.tripTypeContainer}>
            <TouchableOpacity style={styles.tripType} onPress={() => handleSelectType('adventure')}>
              <Image source={adventureImage} style={styles.image} />
              <Text style={styles.tripTypeText}>Adventure</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tripType} onPress={() => handleSelectType('food')}>
              <Image source={foodImage} style={styles.image} />
              <Text style={styles.tripTypeText}>Food</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tripType} onPress={() => handleSelectType('sightseeing')}>
              <Image source={sightseeingImage} style={styles.image} />
              <Text style={styles.tripTypeText}>Sightseeing</Text>
            </TouchableOpacity>
          </View>
        )} */}
      </View>
    </BackgroundGradient>
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
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },


});