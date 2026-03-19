import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { setNavigationRef } from './services/api';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer
          ref={(navigator) => setNavigationRef(navigator)}
        >
          <AppNavigator />
          {/* <StatusBar style="auto" /> */}
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
