import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../config/firebaseConfig';
import { BackgroundGradient } from '../../../constants/globalStyles';
import { HelloWave } from '../../../components/HelloWave';
import { createUser } from '../../../utils/firebaseUtils'; // Correct import for createUser
import * as Animatable from 'react-native-animatable';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is already signed in:", user.email);
        router.replace('/trips'); // Redirect to trips if user is signed in
      }
    });

    return () => unsubscribe(); // Clean up on unmount
  }, []);

  const OnSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Signed in as:", user.email);
      await createUser(); // Ensure user data is created/stored
      router.replace('/trips'); // Navigate to trips
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log("Error signing in:", errorCode, errorMessage);
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Animatable.Text 
          animation="fadeIn" 
          duration={1000} 
          style={styles.title}
          delay={0}>
          Let's Sign You In
        </Animatable.Text>

        <Animatable.Text 
          animation="fadeIn" 
          duration={1000} 
          style={styles.subtitle} 
          delay={500}>
          Welcome!
        </Animatable.Text>
        <Animatable.Text 
          animation="fadeIn" 
          duration={1000} 
          style={styles.subtitle} 
          delay={1000}>
          Adventure awaits!
        </Animatable.Text>
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            onChangeText={(value) => setEmail(value)}
            value={email}
            placeholder='Enter Email'
            placeholderTextColor={'gray'}
          />
        </View>
        <View>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry={true}
            style={styles.input}
            onChangeText={(value) => setPassword(value)}
            value={password}
            placeholder='Enter Password'
            placeholderTextColor={'gray'}
          />
        </View>
        <TouchableOpacity onPress={OnSignIn} style={styles.button}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('auth/sign-up')} style={styles.createAccountButton}>
          <Text style={styles.createAccountButtonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    marginTop: 50,
    height: '200%',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 30,
    color: 'gray',
    marginTop: 20,
  },
  label: {
    marginTop: 20,
    color: 'black',
  },
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: 'black',
  },
  button: {
    padding: 15,
    backgroundColor: 'black',
    borderRadius: 15,
    marginTop: 60,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  createAccountButton: {
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 15,
    marginTop: 20,
    borderWidth: 1,
  },
  createAccountButtonText: {
    color: 'black',
    textAlign: 'center',
  },
});
