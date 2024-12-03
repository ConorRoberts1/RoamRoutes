import 'react-native-get-random-values';
import { View, StyleSheet } from 'react-native';
import React, { useEffect } from 'react';
import { useNavigation } from 'expo-router';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { BackgroundGradient } from '../../constants/globalStyles'; // Ensure the path is correct
import * as Animatable from 'react-native-animatable';

export default function searchFill() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      headerTransparent: true,
      headerTitle: 'Search',
    });
  }, []);

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
          placeholder='Search'
          fetchDetails={true}
          onPress={(data, details = null) => {
            console.log(data, details);
          }}
          query={{
            key: 'AIzaSyBHd0wMM-9p5HkCoik_pLBfm6VXxtJoHi8',
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
    color: 'black', // Ensure the text is visible on the gradient background
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