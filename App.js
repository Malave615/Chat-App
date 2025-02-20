// Import navigator
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Firebase imports
import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getReactNativePersistence,
  getAuth,
} from 'firebase/auth';
import {
  getFirestore,
  disableNetwork,
  enableNetwork,
  Timestamp,
} from 'firebase/firestore';
import { LogBox, Alert } from 'react-native';
import { getStorage } from 'firebase/storage';

// Import async storage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import React, { useEffect } from 'react';

// Import the screens/components
import Start from './components/Start';
import Chat from './components/Chat';

// AsyncStorage warning
LogBox.ignoreLogs(['AsyncStorage has been extracted from react-native core']);

// Create the navigator
const Stack = createNativeStackNavigator();

const App = () => {
  const connectionStatus = useNetInfo();

  const firebaseConfig = {
    apiKey: 'AIzaSyAh_B5brjDibW22ibjGOWffggMD9TC6P_8',
    authDomain: 'chatapp-e319f.firebaseapp.com',
    projectId: 'chatapp-e319f',
    storageBucket: 'chatapp-e319f.firebasestorage.app',
    messagingSenderId: '300050058352',
    appId: '1:300050058352:web:b0c1b21a5d4cb783af38b5',
  };

  // Initialize Firebase and Firestore only if not already initialized
  let app;
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    [app] = getApps(); // Use the already initialized app
  }

  const db = getFirestore(app);
  const storage = getStorage(app);

  // Check if Firebase Auth is already initialized
  const auth = getAuth(app, {
    // initializeAuth changed to getAuth
    persistence: getReactNativePersistence(AsyncStorage),
  });
  // getApps().length === 0
  // ? initializeAuth(app, {
  //   persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  // })
  // : getAuth(app);

  useEffect(() => {
    if (connectionStatus.isConnected === false) {
      Alert.alert('Connection lost!');
      disableNetwork(db);
    } else if (connectionStatus.isConnected === true) {
      Alert.alert('Connection restored!');
      enableNetwork(db);
    }
  }, [connectionStatus.isConnected, db]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start">
          {(props) => (
            <Start {...props} auth={auth} db={db} storage={storage} />
          )}
        </Stack.Screen>
        <Stack.Screen name="Chat">
          {(props) => (
            <Chat
              isConnected={connectionStatus.isConnected}
              {...props}
              db={db}
              storage={storage}
              auth={auth}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
