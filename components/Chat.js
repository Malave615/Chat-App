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

const Chat = ({ route, navigation }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { name = 'Chat', backgroundColor = '#FFFFFF' } = route.params || {};

  // If route.params are missing, show an error and don't run useEffect
  if (!route.params || !name || !backgroundColor) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Missing required params for chat screen.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    navigation.setOptions({ title: name });

    // Simulating message fetching with a timeout
    setTimeout(() => {
      setMessages([
        {
          _id: 1,
          text: 'Hello developer!',
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'React Native',
            avatar: 'https://placeimg.com/140/140/any',
          },
        },
        {
          _id: 2,
          text: 'This is a system message',
          createdAt: new Date(),
          system: true,
        },
      ]);
      setIsLoading(false); // After messages are set, stop loading
    }, 2000); // Simulating 2-sec delay
  }, [name, navigation]);

  // Function to handle sending new messages
  const onSend = (newMessages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages),
    );
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
          onSend={(messages) => onSend(messages)}
          user={{
            _id: 1,
          }}
        />
      )}
      {/* GiftedChat component to display chat messages */}

      {Platform.OS === 'android' && <KeyboardAvoidingView behavior="height" />}
      {Platform.OS === 'ios' && <KeyboardAvoidingView behavior="padding" />}
    </View>
  );
};

Chat.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      name: PropTypes.string.isRequired,
      backgroundColor: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
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
