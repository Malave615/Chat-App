import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import Start from './components/Start';
import Chat from './components/Chat';

// Create the navigator
const Stack = createNativeStackNavigator();

const App = () => {
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
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

  // Initialize Firestore
  const db = getFirestore(app);

  // Initialize AsyncStorage
  const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen name="Start">
          {(props) => <Start {...props} db={db} auth={auth} />}
        </Stack.Screen>
        <Stack.Screen name="Chat">
          {(props) => <Chat {...props} db={db} auth={auth} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
