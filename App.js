import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { getApps, initializeApp } from 'firebase/app';
import {
  getFirestore,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { Alert, LogBox } from 'react-native';
import Start from './components/Start';
import Chat from './components/Chat';

LogBox.ignoreLogs(['AsyncStorage has been extracted from']);

// Create the navigator
const Stack = createNativeStackNavigator();

// Your firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAh_B5brjDibW22ibjGOWffggMD9TC6P_8',
  authDomain: 'chatapp-e319f.firebaseapp.com',
  projectId: 'chatapp-e319f',
  storageBucket: 'chatapp-e319f.firebasestorage.app',
  messagingSenderId: '300050058352',
  appId: '1:300050058352:web:b0c1b21a5d4cb783af38b5',
};

// Initialize Firebase
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firestore and Auth
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const App = () => {
  const connectionStatus = useNetInfo();

  useEffect(() => {
    if (connectionStatus.isConnected === false) {
      Alert.alert('Connection lost!');
      disableNetwork(db);
    } else if (connectionStatus.isConnected === true) {
      Alert.alert('Connection restored!');
      enableNetwork(db);
    }
  }, [connectionStatus.isConnected]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start">
          {(props) => <Start {...props} db={db} auth={auth} />}
        </Stack.Screen>
        <Stack.Screen name="Chat">
          {(props) => (
            <Chat
              isConnected={connectionStatus.isConnected}
              {...props}
              db={db}
              auth={auth}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
