import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { BackgroundGradient } from '../../constants/globalStyles'; 
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, query, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebaseConfig';
import { Swipeable } from 'react-native-gesture-handler';

export default function Trips() {
  const [step, setStep] = useState('initial');
  const [savedTrips, setSavedTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const fetchSavedTrips = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.warn("No user logged in");
        return;
      }
      
      const userId = user.uid;
      const tripsRef = collection(firestore, `users/${userId}/trips`);
      const tripsSnapshot = await getDocs(query(tripsRef));
      
      const trips = [];
      tripsSnapshot.forEach(doc => {
        trips.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setSavedTrips(trips);
      setStep('loadTrips');
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadTrip = (trip) => {
    // Navigate to a trip details page with the trip data
    router.push({
      pathname: "/tripCreation/itinerary",
      params: {
        tripId: trip.id,
        locationData: JSON.stringify(trip.location),
        groupSize: trip.groupSize,
        spending: trip.budget,
        savedActivities: JSON.stringify(trip.activities)
      }
    });
  };

  const handleBack = () => {
    setStep('initial');
  };

  const confirmDeleteTrip = (tripId, tripName) => {
    Alert.alert(
      "Delete Trip",
      `Are you sure you want to delete your trip to ${tripName}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: () => deleteTrip(tripId),
          style: "destructive"
        }
      ]
    );
  };

  const deleteTrip = async (tripId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.warn("No user logged in");
        return;
      }
      
      const userId = user.uid;
      await deleteDoc(doc(firestore, `users/${userId}/trips`, tripId));
      
      // Update the trips list
      setSavedTrips(savedTrips.filter(trip => trip.id !== tripId));
      
      // If there are no more trips, go back to initial step
      if (savedTrips.length <= 1) {
        setStep('initial');
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
      Alert.alert("Error", "Failed to delete trip. Please try again.");
    }
  };

  const renderRightActions = (tripId, tripName) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDeleteTrip(tripId, tripName)}
      >
        <Ionicons name="trash-outline" size={24} color="white" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderTripItem = ({ item }) => {
    const tripName = item.name || item.location?.name || "Unnamed Trip";
    
    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.id, tripName)}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity 
          style={styles.tripItem}
          onPress={() => handleLoadTrip(item)}
        >
          <View style={styles.tripHeader}>
            <Text style={styles.tripName}>
              {tripName}
            </Text>
            <Text style={styles.tripDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.tripDetails}>
            <Text style={styles.tripDetail}>Budget: {item.budget || "$"}</Text>
            <Text style={styles.tripDetail}>Group Size: {item.groupSize || "Solo"}</Text>
            <Text style={styles.tripDetail}>Activities: {item.activities?.length || 0}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        {step !== 'initial' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        )}
        
        {step === 'initial' && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.button} 
              onPress={() => router.push('/tripCreation/searchFill')}
            >
              <Text style={styles.buttonText}>Build new trip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.button} 
              onPress={fetchSavedTrips}
            >
              <Text style={styles.buttonText}>Load saved trips</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {step === 'loadTrips' && (
          <>
            <Text style={styles.heading}>Your Saved Trips</Text>
            {loading ? (
              <ActivityIndicator size="large" color="black" />
            ) : savedTrips.length === 0 ? (
              <Text style={styles.noTripsText}>You don't have any saved trips yet.</Text>
            ) : (
              <FlatList
                data={savedTrips}
                renderItem={renderTripItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.tripsList}
              />
            )}
          </>
        )}
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 20,
    zIndex: 10,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    backgroundColor: 'black',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 20,
    textAlign: 'center'
  },
  noTripsText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666'
  },
  tripsList: {
    paddingBottom: 20
  },
  tripItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  tripName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  tripDate: {
    fontSize: 14,
    color: '#666'
  },
  tripDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tripDetail: {
    fontSize: 14,
    color: '#666'
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 10,
    marginBottom: 15
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    marginTop: 5
  }
});