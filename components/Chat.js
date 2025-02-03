import {
  Platform,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Bubble, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import {
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Chat = ({ route, db, navigation, isConnected }) => {
  const { userID, name, backgroundColor } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [networkError, setNetworkError] = useState(false);

  const unsubMessages = useRef(null);

  useEffect(() => {
    navigation.setOptions({
      title: name,
      color: backgroundColor,
    });
  }, [name, backgroundColor, navigation]);

  useEffect(() => {
    if (isConnected) {
      if (unsubMessages.current) unsubMessages.current();
      unsubMessages.current = null;

      const q = query(
        collection(db, 'messages'),
        orderBy('createdAt', 'desc'),
        where('uid', '==', userID),
      );

      unsubMessages.current = onSnapshot(q, (documentsSnapshot) => {
        const newMessages = [];
        documentsSnapshot.forEach((doc) => {
          newMessages.push({
            _id: doc.id,
            text: doc.data().text,
            createdAt: doc.data().createdAt.toDate(),
            uid: doc.data().uid,
            name: doc.data().name,
            user: {
              _id: doc.data().uid,
              name: doc.data().name,
            },
          });
        });
        cacheMessages(newMessages);
        setMessages(newMessages);
        setIsLoading(false);
        setNetworkError(false);
      });
    } else {
      loadCachedMessages();
      setNetworkError(true);
      console.log('Offline, loading cached messages');
    }

    // Clean up code
    return () => {
      if (unsubMessages.current) unsubMessages.current();
    };
  }, [isConnected]);

  const cacheMessages = async (messagesToCache) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(messagesToCache));
      console.log('Caching messages: ', messagesToCache);
    } catch (error) {
      console.log('Error caching messages: ', error.message);
      Alert.alert('Error', 'Unable to cache messages. Please try again later.');
    }
  };

  // Function to load cached messages from AsyncStorage
  const loadCachedMessages = async () => {
    try {
      const cachedMessages = (await AsyncStorage.getItem('messages')) || [];
      if (cachedMessages) {
        console.log('Loaded cached messages: ', JSON.parse(cachedMessages));
        setMessages(JSON.parse(cachedMessages));
      } else {
        console.log('No cached messages found');
        setMessages([]);
      }
    } catch (error) {
      console.log('Error loading cached messages: ', error.message);
      setMessages([]);
    }
    setIsLoading(false);
  };

  // Function to handle sending messages
  const onSend = (newMessages) => {
    addDoc(collection(db, 'messages'), newMessages[0]);
    const message = newMessages[0];

    // Input validation: Check for empty message or overly long text
    if (!message.text.trim()) {
      Alert.alert('Please enter a message');
      return;
    }

    if (message.text.length > 200) {
      Alert.alert('Message is too long! Please keep it under 200 characters.');
      return;
    }

    // Construct message object with necessary fields
    const messageObject = {
      _id: message._id,
      text: message.text,
      createdAt: new Date(),
      uid: userID,
      name: message.user.name,
      user: {
        _id: userID,
        name: message.user.name,
      },
    };

    try {
      // Add the constructed message object to Firestore
      const docRef = addDoc(collection(db, 'messages'), messageObject);

      // After message is added, update the messages state
      const newMessage = {
        _id: docRef.id,
        ...messageObject,
        createdAt: new Date(),
        user: {
          _id: userID,
          name: message.user.name,
        },
      };

      // Update state with new message
      setMessages((previousMessages) => [newMessage, ...previousMessages]);
      cacheMessages([newMessage, ...messages]);
    } catch (error) {
      console.error('Error sending message: ', error);
      Alert.alert('Error', 'Unable to send message. Please try again later.');
    }
  };

  // Function to render InputToolbar
  const renderInputToolbar = (props) => {
    if (isConnected) {
      return <InputToolbar {...props} />;
    }
    return null; // Hide InputToolbar if offline
  };

  // Function to customize chat bubble color
  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: {
          backgroundColor: '#000', // Sender's bubble
        },
        left: {
          backgroundColor: '#FFF', // Receiver's bubble
        },
      }}
    />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { backgroundColor }]}>
        {/* Show loading spinner if messages are still loading */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text>Loading messages...</Text>
          </View>
        ) : (
          <>
            <GiftedChat
              messages={messages}
              renderBubble={renderBubble}
              onSend={(newMessages) => onSend(newMessages)}
              user={{
                _id: userID, // userID from route.params
                name,
              }}
              inverted // Automatically reverse the messages in the UI
              isSendButtonDisabled={!isConnected} // Disable send button if offline
              renderInputToolbar={renderInputToolbar}
            />
            {/* Only render GiftedChat when connected */}
            {!isConnected && (
              <Text style={styles.noConnectionText}>
                You are offline. Cannot send messages at this time.
              </Text>
            )}
          </>
        )}

        {/* Show error message and retry button if network error occurs */}
        {networkError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Error fetching messages. Please check your network connection.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setNetworkError(false);
              }}
            >
              <Text style={styles.retryButton}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

Chat.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      name: PropTypes.string.isRequired,
      backgroundColor: PropTypes.string.isRequired,
      userID: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  db: PropTypes.object.isRequired,
  navigation: PropTypes.object.isRequired,
  isConnected: PropTypes.bool.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConnectionText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'red',
    marginTop: 20,
  },
  errorContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(225, 0, 0, 0.5)',
    padding: 10,
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
  retryButton: {
    color: '#fff',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default Chat;
