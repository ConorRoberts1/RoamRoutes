import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image'; // Use expo-image
import { getAuth } from 'firebase/auth';
import { firestore } from '../../config/firebaseConfig';
import { collection, getDocs, doc, getDoc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '../../constants/globalStyles';
import { Ionicons } from '@expo/vector-icons';

const blurhash = "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."; // Blurhash placeholder

export default function Messages() {
  const [matches, setMatches] = useState([]);
  const [yourTurnMatches, setYourTurnMatches] = useState([]);
  const [theirTurnMatches, setTheirTurnMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [savedTrips, setSavedTrips] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const matchesSnap = await getDocs(collection(firestore, `users/${userId}/matches`));

        const matchesWithLastMessage = await Promise.all(
          matchesSnap.docs.map(async (docSnap) => {
            const matchedUserId = docSnap.id;
            
            try {
              // Get user profile
              const profileDoc = await getDoc(doc(firestore, `users/${matchedUserId}`));
              const userData = profileDoc.data();
              const profile = userData?.profile || {};
              
              // Get last message in chat
              const chatId = [userId, matchedUserId].sort().join('_');
              const messagesRef = collection(firestore, `chats/${chatId}/messages`);
              const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
              const lastMessageSnap = await getDocs(q);
              
              let lastMessage = null;
              let isYourTurn = true; // Default to your turn if no messages
              
              if (!lastMessageSnap.empty) {
                const lastMessageData = lastMessageSnap.docs[0].data();
                lastMessage = lastMessageData;
                // It's your turn if the last message was from the other person
                isYourTurn = lastMessageData.senderId !== userId;
              }
              
              return {
                userId: matchedUserId,
                name: profile.name || 'Unnamed',
                images: profile.images || [],
                lastMessage,
                isYourTurn,
                timestamp: lastMessage?.timestamp ? new Date(lastMessage.timestamp) : new Date(),
              };
            } catch (error) {
              console.error(`Error fetching data for user ${matchedUserId}:`, error);
              return null;
            }
          })
        );

        const validMatches = matchesWithLastMessage.filter(Boolean);
        
        // Sort by most recent message
        validMatches.sort((a, b) => b.timestamp - a.timestamp);
        
        // Split into your turn and their turn
        const yourTurn = validMatches.filter(match => match.isYourTurn);
        const theirTurn = validMatches.filter(match => !match.isYourTurn);
        
        setYourTurnMatches(yourTurn);
        setTheirTurnMatches(theirTurn);
        setMatches(validMatches);
        
        // Prefetch images
        const imageUrls = validMatches
          .filter(match => match.images && match.images.length > 0)
          .map(match => match.images[0]);
          
        if (imageUrls.length > 0) {
          Image.prefetch(imageUrls);
        }
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [userId]);

  // Add this new function to fetch saved trips
  const fetchSavedTrips = async () => {
    if (!userId) return [];
    
    try {
      const tripsRef = collection(firestore, `users/${userId}/trips`);
      const tripsSnapshot = await getDocs(tripsRef);
      
      const trips = [];
      tripsSnapshot.forEach(doc => {
        trips.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return trips;
    } catch (error) {
      console.error("Error fetching trips:", error);
      return [];
    }
  };

  const handleShareButtonPress = async (matchedUserId) => {
    setSelectedMatchId(matchedUserId);
    const trips = await fetchSavedTrips();
    setSavedTrips(trips);
    setShowShareModal(true);
  };

  const shareItinerary = async (tripId, matchedUserId) => {
    try {
      // Get the trip data
      const tripDoc = await getDoc(doc(firestore, `users/${userId}/trips`, tripId));
      if (!tripDoc.exists()) {
        console.error("Trip not found");
        return;
      }
      
      const tripData = tripDoc.data();
      const chatId = [userId, matchedUserId].sort().join('_');
      
      // Create a shared itinerary message
      const messageData = {
        senderId: userId,
        timestamp: new Date().toISOString(),
        type: 'itinerary',
        content: {
          tripId: tripId,
          tripName: tripData.name || "Shared Itinerary",
          location: tripData.location?.name || "Unknown Location",
          activities: tripData.activities || [],
          senderId: userId
        }
      };
      
      // Add to messages collection
      await setDoc(doc(collection(firestore, `chats/${chatId}/messages`)), messageData);
      
      // Close modal and navigate to chat
      setShowShareModal(false);
      openChat(matchedUserId);
    } catch (error) {
      console.error("Error sharing itinerary:", error);
      Alert.alert("Error", "Failed to share itinerary. Please try again.");
    }
  };

  const openChat = (matchedUserId) => {
    const chatId = [userId, matchedUserId].sort().join('_');
    router.push(`/chat/${chatId}`);
  };

  // Render a single match card with share button
  const renderMatchCard = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.cardContent} 
        onPress={() => openChat(item.userId)}
      >
        <Image
          source={{ 
            uri: item.images && item.images.length > 0 ? item.images[0] : null
          }}
          placeholder={blurhash}
          contentFit="cover"
          transition={300}
          cachePolicy="memory-disk"
          style={styles.avatar}
        />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.name || 'Unnamed'}</Text>
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage.type === 'itinerary' ? 
                'Shared an itinerary' : 
                item.lastMessage.text}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.shareButton}
        onPress={() => handleShareButtonPress(item.userId)}
      >
        <Ionicons name="share-outline" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Render trip selection modal
  const renderShareModal = () => (
    <Modal
      visible={showShareModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowShareModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Share an Itinerary</Text>
          
          <FlatList
            data={savedTrips}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.tripItem}
                onPress={() => shareItinerary(item.id, selectedMatchId)}
              >
                <Text style={styles.tripName}>{item.name || "Unnamed Trip"}</Text>
                <Text style={styles.tripDetail}>
                  {item.activities?.length || 0} activities
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No saved trips to share</Text>
            }
          />
          
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowShareModal(false)}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <BackgroundGradient>
        <View style={styles.container}>
          <Text style={styles.heading}>Your Messages</Text>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.subtitle}>Loading your conversations...</Text>
          </View>
        </View>
      </BackgroundGradient>
    );
  }

  if (matches.length === 0) {
    return (
      <BackgroundGradient>
        <View style={styles.container}>
          <Text style={styles.heading}>Your Messages</Text>
          <View style={styles.centeredContainer}>
            <Text style={styles.subtitle}>You don't have any conversations yet.</Text>
            <Text style={styles.subtitle}>Match with someone to start chatting!</Text>
          </View>
        </View>
      </BackgroundGradient>
    );
  }

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.heading}>Your Messages</Text>

        {yourTurnMatches.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Your Turn</Text>
            <FlatList
              data={yourTurnMatches}
              keyExtractor={(item) => item.userId}
              renderItem={renderMatchCard}
              scrollEnabled={false}
            />
          </View>
        )}

        {theirTurnMatches.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionHeading}>Their Turn</Text>
            <FlatList
              data={theirTurnMatches}
              keyExtractor={(item) => item.userId}
              renderItem={renderMatchCard}
              scrollEnabled={false}
            />
          </View>
        )}
        
        {renderShareModal()}
      </View>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    justifyContent: 'space-between'
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    width: '90%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  tripItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tripName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tripDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 10,
    marginTop: 15,
    alignItems: 'center',
  },
  closeButtonText: {
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  }
});