import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  SafeAreaView,
  Animated,
  Dimensions
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../config/firebaseConfig';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { sendMessage, handleUnmatch } from '../../utils/matchmakingUtils';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BackgroundGradient } from '../../constants/globalStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height, width } = Dimensions.get('window');

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  const router = useRouter();
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const insets = useSafeAreaInsets();
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;

  // Get the other user's ID from the chat ID
  const otherUserId = chatId.split('_').find(id => id !== currentUserId);

  useEffect(() => {
    // Set up keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        if (flatListRef.current && messages.length > 0) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    // Fetch messages
    const q = query(
      collection(firestore, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setIsLoading(false);
      
      // Scroll to bottom on new messages
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    });

    // Fetch other user's profile
    const fetchOtherUserProfile = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOtherUser(userData.profile || {});
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchOtherUserProfile();
    
    // Clean up
    return () => {
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [chatId, currentUserId, otherUserId]);

  // Control the bottom sheet animation
  useEffect(() => {
    if (menuVisible) {
      Animated.spring(bottomSheetAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start();
    } else {
      Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }).start();
    }
  }, [menuVisible]);

  const translateY = bottomSheetAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0]
  });

  const handleSend = async () => {
    if (text.trim()) {
      await sendMessage(chatId, currentUserId, text);
      setText('');
      // Focus on input after sending
      inputRef.current?.focus();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleUnmatchUser = async () => {
    setMenuVisible(false);
    Alert.alert(
      "Unmatch User",
      "Are you sure you want to unmatch? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Unmatch", 
          style: "destructive", 
          onPress: async () => {
            try {
              await handleUnmatch(currentUserId, otherUserId);
              router.replace('/messages');
            } catch (error) {
              console.error('Error unmatching:', error);
              Alert.alert("Error", "Failed to unmatch user. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleHide = () => {
    setMenuVisible(false);
    Alert.alert(
      "Hide Chat",
      "This chat will be hidden from your inbox. You can find it later in archived chats.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Hide", 
          onPress: () => {
            // Implement hide functionality here
            Alert.alert("Success", "Chat has been hidden");
            router.replace('/messages');
          }
        }
      ]
    );
  };

  const handleBlock = () => {
    setMenuVisible(false);
    Alert.alert(
      "Block User",
      "Blocking this user will prevent them from contacting you again. Proceed?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Block User", 
          style: "destructive", 
          onPress: () => {
            // Implement blocking functionality here
            Alert.alert("Success", "User has been blocked");
            router.replace('/messages');
          }
        }
      ]
    );
  };

  const handleReport = () => {
    setMenuVisible(false);
    Alert.alert(
      "Report User",
      "What would you like to report this user for?",
      [
        { text: "Inappropriate Content", onPress: () => submitReport("Inappropriate Content") },
        { text: "Harassment", onPress: () => submitReport("Harassment") },
        { text: "Spam", onPress: () => submitReport("Spam") },
        { text: "Other", onPress: () => submitReport("Other") },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  const submitReport = (reason) => {
    // Implement the reporting functionality here
    Alert.alert("Report Submitted", "Thank you for your report. We'll review it shortly.");
  };

  return (
    <BackgroundGradient>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="white" />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>{otherUser?.name || 'Chat'}</Text>
              
              <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
                <Feather name="more-vertical" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Loading conversation...</Text>
              </View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messageList}
                onLayout={() => {
                  if (flatListRef.current && messages.length > 0) {
                    flatListRef.current.scrollToEnd({ animated: false });
                  }
                }}
                renderItem={({ item }) => {
                  const isSender = item.senderId === currentUserId;
                  return (
                    <View style={[
                      styles.messageRow,
                      isSender ? styles.sentMessageRow : styles.receivedMessageRow
                    ]}>
                      <View style={[
                        styles.messageBubble,
                        isSender ? styles.sentBubble : styles.receivedBubble
                      ]}>
                        <Text style={styles.messageText}>{item.text}</Text>
                        <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
                      </View>
                    </View>
                  );
                }}
              />
            )}
            
            <View style={styles.inputContainerWrapper}>
              <View style={styles.inputContainer}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="Type a message..."
                  placeholderTextColor="#aaa"
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity 
                  style={[
                    styles.sendButton,
                    !text.trim() && styles.sendButtonDisabled
                  ]}
                  onPress={handleSend}
                  disabled={!text.trim()}
                >
                  <Feather name="send" size={22} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />
          <Animated.View 
            style={[
              styles.bottomSheet,
              { transform: [{ translateY: translateY }] }
            ]}
          >
            <View style={styles.bottomSheetHandle}>
              <View style={styles.handleBar} />
            </View>
            
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={() => {
                Alert.alert("We Met", "Confirming you've met this person in real life.");
                setMenuVisible(false);
              }}
            >
              <Text style={styles.actionText}>We Met</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={handleHide}
            >
              <Text style={styles.actionText}>Hide</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={handleUnmatchUser}
            >
              <Text style={styles.actionText}>Unmatch</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem} 
              onPress={handleReport}
            >
              <Text style={styles.actionTextRed}>Report</Text>
            </TouchableOpacity>
            
            <View style={styles.cancelButtonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setMenuVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </BackgroundGradient>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    padding: 10 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  },
  messageList: {
    paddingVertical: 20,
    paddingHorizontal: 5,
  },
  messageRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  sentMessageRow: {
    justifyContent: 'flex-end',
  },
  receivedMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    padding: 12,
    paddingBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  sentBubble: {
    backgroundColor: '#4A69FF',
    borderTopRightRadius: 4,
  },
  receivedBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderTopLeftRadius: 4,
  },
  messageText: {
    color: 'white',
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainerWrapper: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  input: {
    flex: 1,
    padding: 12,
    paddingTop: 12,
    color: 'white',
    fontSize: 16,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: '#4A69FF',
    borderRadius: 25,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    marginRight: 2,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(74, 105, 255, 0.6)',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 30,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    height: height * 0.5,
  },
  bottomSheetHandle: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#DDDDDD',
    borderRadius: 3,
  },
  actionItem: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  actionText: {
    fontSize: 20,
    fontWeight: '400',
    color: '#000',
    textAlign: 'center',
  },
  actionTextRed: {
    fontSize: 20,
    fontWeight: '400',
    color: '#FF3B30',
    textAlign: 'center',
  },
  cancelButtonContainer: {
    padding: 20,
    marginTop: 'auto'
  },
  cancelButton: {
    paddingVertical: 15,
    borderRadius: 15,
    backgroundColor: '#f2f2f2',
  },
  cancelText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
});