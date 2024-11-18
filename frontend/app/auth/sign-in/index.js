import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../config/firebaseConfig';

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const OnSignIn = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log("Signed in as:", user.email);
        Alert.alert("Success", "Signed in successfully!");
        // Redirect to home or other screen
        router.replace('/'); // Replace with your target route
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("Error signing in:", errorCode, errorMessage);
        Alert.alert("Error", errorMessage);
      });
  };

  return (
    <View
      style={{
        padding: 25,
        marginTop: 50,
        height: '200%',
        backgroundColor: 'white',
      }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: 'bold',
        }}
      >
        Let's Sign You In
      </Text>

      <Text
        style={{
          fontSize: 30,
          color: 'gray',
          marginTop: 20,
        }}
      >
        Welcome!
      </Text>

      <Text
        style={{
          fontSize: 30,
          color: 'gray',
          marginTop: 20,
        }}
      >
        Adventure awaits!
      </Text>

      <View>
        <Text style={{ marginTop: 69, color: 'black' }}>Email</Text>
        <TextInput
          style={styles.input}
          onChangeText={(value) => setEmail(value)}
          value={email}
          placeholder='Enter Email'
          placeholderTextColor={'gray'}
        />
      </View>
      <View>
        <Text style={{ marginTop: 20 }}>Password</Text>
        <TextInput
          secureTextEntry={true}
          style={styles.input}
          onChangeText={(value) => setPassword(value)}
          value={password}
          placeholder='Enter Password'
          placeholderTextColor={'gray'}
        />
      </View>

      {/* Sign in button */}
      <TouchableOpacity
        onPress={OnSignIn}
        style={{
          padding: 15,
          backgroundColor: 'black',
          borderRadius: 15,
          marginTop: 60,
        }}
      >
        <Text
          style={{
            color: 'white',
            textAlign: 'center',
          }}
        >
          Sign in
        </Text>
      </TouchableOpacity>

      {/* Create Account button */}
      <TouchableOpacity
        onPress={() => router.replace('auth/sign-up')}
        style={{
          padding: 15,
          backgroundColor: 'white',
          borderRadius: 15,
          marginTop: 20,
          borderWidth: 1,
        }}
      >
        <Text
          style={{
            color: 'black',
            textAlign: 'center',
          }}
        >
          Create Account
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 15,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: 'lightgrey',
  },
});
