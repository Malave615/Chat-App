import { Bubble, GiftedChat, InputToolbar } from 'react-native-gifted-chat';
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import PropTypes from 'prop-types';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView from 'react-native-maps';
import CustomActions from './CustomActions';

const Chat = ({ route, navigation, db, isConnected, storage }) => {
  const { userID, name, backgroundColor } = route.params;
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Set the navigation bar title to the user's name
    navigation.setOptions({ title: name });

    const fetchMessages = async () => {
      if (isConnected) {
        // Create a Firestore query to fetch messages in descending order
        const q = query(
          collection(db, 'messages'),
          orderBy('createdAt', 'desc'),
        );
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const newMessages = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              _id: doc.id,
              text: data.text || '',
              createdAt: data.createdAt?.toDate() || new Date(),
              user: data.user,
              image: data.image || null,
              location: data.location || null,
            };
          });
          setMessages(newMessages);

          try {
            // Cache the messages locally for offline use
            await AsyncStorage.setItem(
              'cachedMessages',
              JSON.stringify(newMessages),
            );
          } catch (error) {
            console.error('Error caching messages:', error);
          }
        });

        // Cleanup listener when the component unmounts
        return () => unsubscribe();
      }
      try {
        // Load cached messages when offline
        const cachedMessages = await AsyncStorage.getItem('cachedMessages');
        if (cachedMessages) setMessages(JSON.parse(cachedMessages));
      } catch (error) {
        console.error('Error loading cached messages:', error);
      }
    };

    fetchMessages();
  }, [db, isConnected, name, navigation]);

  // Send a new message to Firestore
  const onSend = (newMessages) => {
    console.log('newMessages:', newMessages); // Debugging line

    if (Array.isArray(newMessages) && newMessages.length > 0) {
      const [message] = newMessages;

      addDoc(collection(db, 'messages'), {
        _id: message._id,
        text: message.text || '',
        createdAt: serverTimestamp(),
        user: message.user,
        image: message.image || null,
        location: message.location || null,
      });

      setMessages((prev) => GiftedChat.append(prev, newMessages));
    } else {
      Alert.alert('Invalid message format.');
    }
  };

  // Render input toolbar only when the user is online
  const renderInputToolbar = (props) =>
    isConnected ? <InputToolbar {...props} /> : null;

  // Render custom actions buttons
  const renderCustomActions = (props) => (
    <CustomActions
      userID={userID}
      name={name}
      {...props}
      onSend={onSend}
      storage={storage}
    />
  );

  // Render custom view for messages
  const renderCustomView = (props) => {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={styles.mapView}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      );
    }
    return null;
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
        <Text style={styles.chatTitle}>Welcome, {name}!</Text>

        <GiftedChat
          messages={messages}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderActions={renderCustomActions}
          renderCustomView={renderCustomView}
          onSend={(newMessages) => onSend(newMessages)}
          user={{
            _id: userID, // userID from route.params
            name, // username from route.params
          }}
          inverted // Automatically scrolls to the latest message
        />

        {/* Only show the send button when connected */}
        {isConnected && (
          <TouchableOpacity
            style={[styles.sendButton, { opacity: isConnected ? 1 : 0.5 }]} // Disable when offline
            disabled={!isConnected} // Disable send button when offline
            onPress={() => {
              if (isConnected) {
                // Only sent a message when connected
                const newMessage = {
                  _id: Date.now(), // Use current time as unique ID
                  uid: userID,
                  name,
                  text: 'Hello, World!',
                  createdAt: new Date(),
                  user: {
                    _id: userID,
                    name,
                  },
                };
                onSend([newMessage]); // Trigger onSend manually with a new message
              } else {
                Alert.alert(
                  'You are offline. Messages will be sent when you are back online.',
                );
              }
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

Chat.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      userID: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      backgroundColor: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
  db: PropTypes.object.isRequired,
  isConnected: PropTypes.bool.isRequired,
  renderCustomView: PropTypes.func,
  currentMessage: PropTypes.object,
  storage: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sendButton: {
    backgroundColor: '#000',
    height: 50,
    width: '88%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  sendButtonText: {
    color: '#fff',
  },
  bubbleTextRight: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    flexWrap: 'nowrap',
  },
  bubbleTextLeft: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
    flexWrap: 'nowrap',
  },
  mapView: {
    width: 150,
    height: 100,
    borderRadius: 13,
    margin: 3,
  },
});

export default Chat;
