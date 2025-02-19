import { View, StyleSheet } from 'react-native';
import React from 'react';
import Login from '../components/Login'; // Ensure the path is correct
import { auth } from './../config/firebaseConfig';
import { Redirect } from 'expo-router';

export default function Index() {
  const user = auth.currentUser;

  return (
    <View style={styles.container}>
      {user ? <Redirect href={'/trips'} /> : <Login />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures the container fills the entire screen
  },
});
