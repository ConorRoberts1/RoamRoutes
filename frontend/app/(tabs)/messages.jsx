import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../config/firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { BackgroundGradient } from '../../constants/globalStyles';

export default function Messages() {
  const [matches, setMatches] = useState([]);
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const router = useRouter();

  useEffect(() => {
    const fetchMatches = async () => {
      if (!userId) return;

      const matchesSnap = await getDocs(collection(firestore, `users/${userId}/matches`));

      const data = await Promise.all(
        matchesSnap.docs.map(async (docSnap) => {
          const matchedUserId = docSnap.id;
          const profileDoc = await getDoc(doc(firestore, `users/${matchedUserId}`));
          return {
            userId: matchedUserId,
            ...profileDoc.data(),
          };
        })
      );

      setMatches(data.filter(Boolean));
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

        {matches.length === 0 ? (
          <Text style={styles.subtitle}>Start chatting with your matches!</Text>
        ) : (
          <FlatList
            data={matches}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.card} onPress={() => openChat(item.userId)}>
                <Image
                  source={{ uri: item.profile?.imageUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <Text style={styles.name}>{item.profile?.name || 'Unnamed'}</Text>
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
});
