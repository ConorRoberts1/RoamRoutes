import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, TextInput, FlatList, Text, Button, StyleSheet } from 'react-native';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { sendMessage } from '../../utils/matchmakingUtils';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  useEffect(() => {
    const q = query(
      collection(firestore, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (text.trim()) {
      await sendMessage(chatId, currentUserId, text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text
            style={[
              styles.message,
              {
                alignSelf: item.senderId === currentUserId ? 'flex-end' : 'flex-start',
                backgroundColor: item.senderId === currentUserId ? '#DCF8C6' : '#EEE',
              },
            ]}
          >
            {item.text}
          </Text>
        )}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  message: {
    padding: 10,
    marginVertical: 5,
    borderRadius: 10,
    maxWidth: '80%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5,
    borderTopWidth: 1,
    borderColor: '#ccc',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    borderColor: '#ccc',
    marginRight: 8,
  },
});
