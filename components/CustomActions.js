import { TouchableOpacity, Text, View, StyleSheet, Alert } from 'react-native';
import PropTypes from 'prop-types';
import { useActionSheet } from '@expo/react-native-action-sheet';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import React from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CustomActions = ({
  wrapperStyle,
  iconTextStyle,
  onSend,
  storage,
  userID,
  name,
}) => {
  const actionSheet = useActionSheet();

  const onActionPress = () => {
    const options = [
      'Choose from Library',
      'Take Picture',
      'Send Location',
      'Cancel',
    ];
    const cancelButtonIndex = options.length - 1;
    actionSheet.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            pickImage();
            return;
          case 1:
            takePhoto();
            return;
          case 2:
            getLocation();
            break;
          default:
        }
      },
    );
  };

  // Function to pick an image from the gallery
  const pickImage = async () => {
    const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissions?.granted) {
      const result = await ImagePicker.launchImageLibraryAsync();

      if (result && !result.canceled) {
        await uploadAndSendImage(result.assets[0].uri);
      } else {
        Alert.alert('Action was canceled or failed.');
      }
    } else {
      Alert.alert("Permissions haven't been granted.");
    }
  };

  // Function to take a photo using the camera
  const takePhoto = async () => {
    const permissions = await ImagePicker.requestCameraPermissionsAsync();

    if (permissions?.granted) {
      const result = await ImagePicker.launchCameraAsync();
      if (result && !result.canceled) {
        await uploadAndSendImage(result.assets[0].uri);
      } else {
        Alert.alert('Action was canceled or failed.');
      }
    } else {
      Alert.alert("Permissions haven't been granted.");
    }
  };

  // Function to share user's location
  const getLocation = async () => {
    const permissions = await Location.requestForegroundPermissionsAsync();

    if (permissions?.granted) {
      const location = await Location.getCurrentPositionAsync({});
      if (location) {
        onSend([
          {
            _id: `${new Date().getTime()}-${userID}`,
            user: { _id: userID, name },
            location: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
          },
        ]);
      } else {
        Alert.alert('Error occurred while fetching location');
      }
    } else {
      Alert.alert('Permissions to read location was denied.');
    }
  };

  const generateReference = (uri) => {
    const timeStamp = new Date().getTime();
    const imageName = uri.split('/')[uri.split('/').length - 1];
    return `${userID}-${timeStamp}-${imageName}`;
  };

  // Upload and send image as message
  const uploadAndSendImage = async (imageURI) => {
    const uniqueRefString = generateReference(imageURI);
    const newUploadRef = ref(storage, uniqueRefString);
    try {
      const response = await fetch(imageURI);
      const blob = await response.blob();
      const snapshot = await uploadBytes(newUploadRef, blob);
      console.log('File has been uploaded successfully');
      const imageURL = await getDownloadURL(snapshot.ref);

      // Generate a unique _id for the message
      const messageId = `${new Date().getTime()}-${userID}`;

      onSend([
        {
          _id: messageId, // Assign a unique ID
          user: { _id: userID, name },
          image: imageURL,
        },
      ]);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error uploading image', error.message);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.container} onPress={onActionPress}>
        <View style={[styles.wrapper, wrapperStyle]}>
          <Text style={[styles.iconText, iconTextStyle]}>+</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: '#b2b2b2',
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: '#b2b2b2',
    fontWeight: 'bold',
    fontSize: 10,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
});

CustomActions.propTypes = {
  wrapperStyle: PropTypes.object,
  iconTextStyle: PropTypes.object,
  onSend: PropTypes.func,
  storage: PropTypes.object.isRequired,
  userID: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
};

export default CustomActions;
