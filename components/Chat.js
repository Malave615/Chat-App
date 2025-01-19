import {
  Platform,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Text,
  ActivityIndicator,
} from 'react-native';
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    navigation.setOptions({
      title: name,
      color: backgroundColor,
    });
  }, [userID, db]);

  let unsubMessages;

  useEffect(() => {
    if (unsubMessages) unsubMessages();
    unsubMessages = null;

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    unsubMessages = onSnapshot(q, (docs) => {
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
    });

    // Clean up code
    return () => {
      if (unsubMessages) unsubMessages();
    };
  }, []);

  // Function to save sent messages to Firestore db
  const onSend = async (newMessages = []) => {
    const message = newMessages[0];

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
          />
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
});

export default Chat;
