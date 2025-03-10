import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter, Link } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../config/firebaseConfig';
import { BackgroundGradient } from '../../../constants/globalStyles';
import * as Animatable from 'react-native-animatable';

export default function SignUp() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const OnCreateAccount = () => {
    if (!email || !password || !username) {
      Alert.alert("Error", "Please fill out all information correctly.");
      return;
    }

    console.log("Creating account for:", email);
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("User created:", user);
        
        // Redirect to sign-in page with email and password as query parameters
        router.replace({
          pathname: '/auth/sign-in',
          params: { email, password },
        });
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("Error creating account:", errorCode, errorMessage);
        Alert.alert("Error", errorMessage);
      });
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Animatable.Text 
          animation="fadeIn" 
          duration={1000} 
          style={styles.title}>
          Create New Account
        </Animatable.Text>

        <View>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Username"
            onChangeText={(value) => setUsername(value)}
            placeholderTextColor={'gray'}
          />
        </View>

        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Email"
            onChangeText={(value) => setEmail(value)}
            placeholderTextColor={'gray'}
          />
        </View>

        <View>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry={true}
            style={styles.input}
            placeholder="Enter Password"
            onChangeText={(value) => setPassword(value)}
            placeholderTextColor={'gray'}
          />
        </View>

        <TouchableOpacity onPress={OnCreateAccount} style={styles.button}>
          <Text style={styles.buttonText}>Create account</Text>
        </TouchableOpacity>

        <Link href="/auth/sign-in" asChild>
          <TouchableOpacity style={styles.createAccountButton}>
            <Text style={styles.createAccountButtonText}>Already have an account?</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 25,
    marginTop: 50,
    height: '100%',
  },
  title: {
    fontWeight: 'bold',
    marginTop: 20,
    fontSize: 30,
    textAlign: 'center',
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
    marginTop: 10,
  },
  button: {
    padding: 15,
    backgroundColor: 'black',
    borderRadius: 15,
    marginTop: 40,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
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