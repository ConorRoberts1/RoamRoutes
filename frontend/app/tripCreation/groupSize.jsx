import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
import React, { useState } from "react";
import { BackgroundGradient } from "../../constants/globalStyles";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../../config/firebaseConfig";
import { getAuth } from "firebase/auth";
import * as Animatable from 'react-native-animatable';

export default function GroupSize() {
  const router = useRouter();
  const auth = getAuth();
  const { tripId, locationData: locationDataString } = useLocalSearchParams();
  const locationData = JSON.parse(locationDataString);


  const [groupSize, setGroupSize] = useState(null);

  const handleGroupSelection = (selection) => {
    if (selection === "Group") {
      Alert.prompt(
        "Enter Group Size",
        "How many people are in your group?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "OK",
            onPress: (value) => {
              if (isNaN(value) || value <= 0) {
                Alert.alert("Error", "Please enter a valid number.");
              } else {
                setGroupSize(value);
                saveGroupSize("Group", value);
              }
            },
          },
        ],
        "plain-text"
      );
    } else {
      saveGroupSize(selection, null);
    }
  };

  const saveGroupSize = async (sizeType, groupCount) => {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      Alert.alert("Error", "No user signed in");
      return;
    }
  
    const updatedData = {
      ...locationData,
      groupType: sizeType,
      groupSize: groupCount || (sizeType === "Duo" ? 2 : 1),
    };
  
    try {
      const locationDocRef = doc(
        firestore,
        `users/${userId}/trips/${tripId}/locations`,
        locationData.place_id
      );
      await setDoc(locationDocRef, updatedData, { merge: true });
      
      console.log("Group size saved successfully:", updatedData);
      Alert.alert("Success", "Group size saved successfully!");
      
      router.push({
        pathname: "/",
        params: { 
          tripId, 
          locationData: JSON.stringify(updatedData) 
        }
      });
    } catch (error) {
      console.error("Error saving group size:", error.message);
      Alert.alert("Error", "Failed to save group size.");
    }
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.title}>Choose Your Group Size</Text>
        <TouchableOpacity style={styles.button} onPress={() => handleGroupSelection("Solo")}>
          <Text style={styles.buttonText}>Solo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleGroupSelection("Duo")}>
          <Text style={styles.buttonText}>Duo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => handleGroupSelection("Group")}>
          <Text style={styles.buttonText}>Group</Text>
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
