import { useLocalSearchParams, useRouter } from "expo-router"; // Add useRouter
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import React from "react";
import { BackgroundGradient } from "../../constants/globalStyles";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../../config/firebaseConfig";

export default function Spending() {
  const router = useRouter(); 
  const { tripId, locationData: locationDataString } = useLocalSearchParams();
  const locationData = JSON.parse(locationDataString);

  if (!tripId || !locationData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error: Missing Trip Data</Text>
      </View>
    );
  }

  const handleSpendingSelect = async (amount) => {
    const spendingMap = {
      "$": { min: 0, max: 20 },
      "$$": { min: 21, max: 50 },
      "$$$": { min: 51, max: 100 },
    };
  
    const spendingThreshold = spendingMap[amount];
  
    const updatedLocationData = {
      ...locationData,
      spending: amount,
      spendingRange: spendingThreshold,
    };
  
    try {
      // Use the tripId directly instead of user path
      const locationDocRef = doc(
        firestore,
        `trips/${tripId}/locations`,
        locationData.place_id
      );
      await setDoc(locationDocRef, updatedLocationData, { merge: true });
  
      console.log("Spending saved successfully:", updatedLocationData);
  
      
      router.push({
        pathname: "/tripCreation/activityHelper",
        params: { tripId, locationData: JSON.stringify(updatedLocationData) },
      });
    } catch (error) {
      console.error("Error saving spending data:", error.message);
      Alert.alert("Error", "Failed to save spending data.");
    }
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.title}>How much do you want to spend?</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleSpendingSelect("$")}>
          <Text style={styles.buttonText}>$</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleSpendingSelect("$$")}>
          <Text style={styles.buttonText}>$$</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleSpendingSelect("$$$")}>
          <Text style={styles.buttonText}>$$$</Text>
        </TouchableOpacity>
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "black",
    marginBottom: 20,
  },
  button: {
    padding: 15,
    backgroundColor: "black",
    borderRadius: 15,
    marginTop: 20,
    width: "80%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 20,
  },
});
