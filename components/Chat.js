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
import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Bubble, GiftedChat } from 'react-native-gifted-chat';
import {
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
} from 'firebase/firestore';

const Chat = ({ route, db, navigation }) => {
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
  }, [userID, db]);

  useEffect(() => {
    if (unsubMessages.current) {
      unsubMessages.current();
    }

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    unsubMessages.current = onSnapshot(
      q,
      (docs) => {
        const newMessages = [];
        docs.forEach((doc) => {
          newMessages.push({
            _id: doc.id,
            ...doc.data(),
            createdAt: new Date(doc.data().createdAt.toMillis()),
          });
        });

        setIsLoading(false);
        setMessages(newMessages);
        setNetworkError(false); // Reset error state
      },
      (error) => {
        console.error('Error fetching messages: ', error);
        setIsLoading(false);
        setNetworkError(true);
      },
    );

    // Clean up code
    return () => {
      if (unsubMessages.current) {
        unsubMessages.current();
      }
    };
  }, []);

  // Function to save sent messages to Firestore db
  const onSend = async (newMessages = []) => {
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
      text: message.text,
      createdAt: new Date(),
      uid: userID,
      name: message.user.name,
    };

    try {
      // Add the constructed message object to Firestore
      const docRef = await addDoc(collection(db, 'messages'), messageObject);

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
    } catch (error) {
      console.error('Error sending message: ', error);
      Alert.alert('Error', 'Unable to send message. Please try again later.');
    }
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
          <GiftedChat
            messages={messages}
            renderBubble={renderBubble}
            onSend={(newMessages) => onSend(newMessages)}
            user={{
              _id: userID, // userID from route.params
              name,
            }}
            inverted={true} // Automatically reverse the messages in the UI
          />
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
