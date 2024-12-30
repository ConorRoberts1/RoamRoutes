import { useLocalSearchParams } from "expo-router";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from "react-native";
import React, { useState } from "react";
import { BackgroundGradient } from "../../constants/globalStyles";
import { doc, setDoc } from "firebase/firestore";
import { firestore } from "../../config/firebaseConfig";

export default function PeopleAmount() {
    const { tripId, locationData } = useLocalSearchParams();
    const [groupSize, setGroupSize] = useState("");

    if (!tripId || !locationData) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Error: Missing Trip Data</Text>
            </View>
        );
    }

    const handlePeopleSelect = async (type) => {
        let size = groupSize;
        if (type === "solo") size = 1;
        if (type === "duo") size = 2;

        const itineraryData = {
            ...locationData,
            people: size,
        };

        try {
            const docRef = doc(firestore, "itineraries", locationData.name);
            await setDoc(docRef, itineraryData);
            Alert.alert("Success", "Itinerary saved successfully!");
            // Navigate to the next page or perform any other action
        } catch (error) {
            Alert.alert("Error", error.message);
        }
    };

    return (
        <BackgroundGradient>
            <View style={styles.container}>
                <Text style={styles.title}>How many people are attending?</Text>
                <TouchableOpacity style={styles.button} onPress={() => handlePeopleSelect("solo")}>
                    <Text style={styles.buttonText}>Solo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => handlePeopleSelect("duo")}>
                    <Text style={styles.buttonText}>Duo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={() => handlePeopleSelect("group")}>
                    <Text style={styles.buttonText}>Group</Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Enter group size"
                    keyboardType="numeric"
                    value={groupSize}
                    onChangeText={setGroupSize}
                />
                <TouchableOpacity style={styles.button} onPress={() => handlePeopleSelect("group")}>
                    <Text style={styles.buttonText}>Submit Group Size</Text>
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
    input: {
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        marginTop: 20,
        paddingHorizontal: 10,
        width: "80%",
        borderRadius: 5,
    },
});