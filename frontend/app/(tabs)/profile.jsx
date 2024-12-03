import { View, Text, Button, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import React from 'react';
import { BackgroundGradient } from '../../constants/globalStyles'; 
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

export default function Profile() {
  const router = useRouter();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        Alert.alert("Success", "Logged out successfully!");
        router.replace('/auth/sign-in');
      })
      .catch((error) => {
        Alert.alert("Error", error.message);
      });
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Text style={styles.buttonText}>Log Out</Text>
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
    marginBottom: 20,
    color: 'black', 
  },
  button: {
    padding: 15,
    backgroundColor: 'black',
    borderRadius: 15,
    marginTop: 20,
    width: '80%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 20,
  },
});