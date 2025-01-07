import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  ImageBackground,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const Start = ({ navigation }) => {
  const [name, setName] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('');
  const colors = ['#090C08', '#474056', '#8A95A5', '#B9C6AE'];

  useEffect(() => {
    navigation.setOptions({
      title: 'Welcome',
      headerTitleStyle: styles.headerTitle,
    });
  }, [navigation]);

  // Navigate to the Chat screen, passing name and color parameters
  const handleStartChat = () => {
    navigation.navigate('Chat', { name, backgroundColor });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/background.png')}
        style={styles.background}
      >
        <View style={styles.contentContainer}>
          <View style={styles.inputContainer}>
            <View style={styles.textInputWrapper}>
              {/* Name input */}
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor="#757083"
              />

              {/* SVG Icon as a placeholder */}
              <Svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 19"
                style={styles.iconImage}
              >
                <Path
                  d="M12,13.2533333 C15.24,13.2533333 21.6,14.830125 21.6,18.105 L21.6,20.5308333 L2.4,20.5308333 L2.4,18.105 C2.4,14.830125 8.76,13.2533333 12,13.2533333 Z M20.64,19.5708333 L20.64,18.105 C20.64,16.0913979 15.9773097,14.2133333 12,14.2133333 C8.02269035,14.2133333 3.36,16.0913979 3.36,18.105 L3.36,19.5708333 L20.64,19.5708333 Z M12,11.36 C9.624,11.36 7.68,9.443 7.68,7.1 C7.68,4.757 9.624,2.84 12,2.84 C14.376,2.84 16.32,4.757 16.32,7.1 C16.32,9.443 14.376,11.36 12,11.36 Z M12,10.4 C13.8487889,10.4 15.36,8.90977792 15.36,7.1 C15.36,5.29022208 13.8487889,3.8 12,3.8 C10.1512111,3.8 8.64,5.29022208 8.64,7.1 C8.64,8.90977792 10.1512111,10.4 12,10.4 Z"
                  fill="#757083"
                />
              </Svg>
            </View>

            {/* Color selection */}
            <Text style={styles.colorText}>Choose Background Color:</Text>
            <View style={styles.colorContainer}>
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    backgroundColor === color && styles.selectedColor,
                  ]}
                  onPress={() => setBackgroundColor(color)}
                />
              ))}
            </View>

            {/* Start chat button */}
            <TouchableOpacity
              accessible={true}
              accessibilityLabel="Start Chatting"
              style={styles.button}
              onPress={handleStartChat}
            >
              <Text style={styles.buttonText}>Start Chatting</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

Start.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
    setOptions: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: '30%',
  },
  headerTitle: {
    fontSize: 45,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '88%',
    alignItems: 'center',
  },
  textInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    width: '100%',
    height: 60,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#757083',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  textInput: {
    flex: 1,
    height: 60,
    paddingLeft: 40,
    fontSize: 16,
    fontWeight: '300',
    color: '#757083',
    opacity: 0.5,
  },
  iconImage: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: [{ translateY: -12 }], // Center the image vertically
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
  colorText: {
    fontSize: 16,
    fontWeight: '300',
    color: '#757083',
    opacity: 1,
    marginBottom: 10,
  },
  colorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 20,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  selectedColor: {
    borderWidth: 2,
    borderColor: '#757083',
  },
  button: {
    backgroundColor: '#757083',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Start;
