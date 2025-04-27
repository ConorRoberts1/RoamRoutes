import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Colors } from '@/constants/Colors'; 
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '../constants/globalStyles'; 
import * as Animatable from 'react-native-animatable';

export default function Login() {
  const router = useRouter();

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Animatable.Text
          animation="fadeIn"
          duration={1000}
          style={styles.title}
          delay={0}
        >
          Roam Routes
        </Animatable.Text>

        <Animatable.Text
          animation="fadeIn"
          duration={1000}
          style={styles.subtitle}
          delay={500}
        >
          Discover new places and meet new people!
        </Animatable.Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/auth/sign-in')}
        >
          <Text style={styles.buttonText}>Get Started!</Text>
        </TouchableOpacity>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 25,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: Colors.grey,
    marginTop: 20,
  },
  button: {
    padding: 15,
    backgroundColor: 'black',
    borderRadius: 99,
    marginTop: 60,
    width: '80%', 
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
  },
});
