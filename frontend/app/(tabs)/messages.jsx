import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image'; // Use expo-image
import { getAuth } from 'firebase/auth';
import { firestore } from '../../config/firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '../../constants/globalStyles';

const blurhash = "LGF5]+Yk^6#M@-5c,1J5@[or[Q6."; // Blurhash placeholder

export default function Messages() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!userId) return;
      
      try {
        setLoading(true);
        const matchesSnap = await getDocs(collection(firestore, `users/${userId}/matches`));

        const data = await Promise.all(
          matchesSnap.docs.map(async (docSnap) => {
            const matchedUserId = docSnap.id;
            
            try {
              const profileDoc = await getDoc(doc(firestore, `users/${matchedUserId}`));
              // Get profile data
              const userData = profileDoc.data();
              
              // Extract profile from user data
              const profile = userData?.profile || {};
              
              return {
                userId: matchedUserId,
                name: profile.name || 'Unnamed',
                images: profile.images || [],
                // Add any other needed fields
              };
            } catch (error) {
              console.error(`Error fetching profile for user ${matchedUserId}:`, error);
              return null;
            }
          })
        );

        const validData = data.filter(Boolean);
        
        // Prefetch images for the match list
        if (validData.length > 0) {
          const imageUrls = validData
            .filter(match => match.images && match.images.length > 0)
            .map(match => match.images[0]);
            
          if (imageUrls.length > 0) {
            Image.prefetch(imageUrls);
          }
        }
        
        setMatches(validData);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [userId]);

  const openChat = (matchedUserId) => {
    const chatId = [userId, matchedUserId].sort().join('_');
    router.push(`/chat/${chatId}`);
  };

  return (
    <BackgroundGradient>
      <View style={styles.container}>
        <Text style={styles.heading}>Your Matches</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.subtitle}>Loading your matches...</Text>
          </View>
        ) : matches.length === 0 ? (
          <Text style={styles.subtitle}>Start chatting with your matches!</Text>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => openChat(item.userId)}>
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
                <Text style={styles.name}>{item.name || 'Unnamed'}</Text>
              </TouchableOpacity>
            )}
          />
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  name: {
    fontSize: 18,
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});