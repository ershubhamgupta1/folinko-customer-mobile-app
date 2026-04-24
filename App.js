import { NavigationContainer } from '@react-navigation/native';
import * as ExpoLinking from 'expo-linking';
import { ShareIntentModule, ShareIntentProvider, getShareExtensionKey } from 'expo-share-intent';
import { Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { setNavigationRef } from './services/api';

const APP_SCHEME = 'folinko';
const SHARE_INTENT_OPTIONS = {
  debug: __DEV__,
  scheme: APP_SCHEME,
};
const APP_PREFIX = ExpoLinking.createURL('/');

const linking = {
  prefixes: [`${APP_SCHEME}://`, APP_PREFIX],
  config: {
    screens: {
      feedScreen: 'feed',
      handleShare: 'handle-share',
    },
  },
  async getInitialURL() {
    console.log('App.js: getInitialURL called');
    const hasPendingShareIntent = ShareIntentModule?.hasShareIntent?.(
      getShareExtensionKey(SHARE_INTENT_OPTIONS)
    );
    console.log('App.js: hasPendingShareIntent:', hasPendingShareIntent);

    if (hasPendingShareIntent) {
      console.log('App.js: Returning handle-share URL');
      return `${APP_SCHEME}://handle-share`;
    }

    const initialUrl = await Linking.getInitialURL();
    console.log('App.js: Linking.getInitialURL:', initialUrl);
    return initialUrl;
  },
  subscribe(listener) {
    console.log('App.js: subscribe called');
    const urlSubscription = Linking.addEventListener('url', ({ url }) => {
      console.log('App.js: URL event:', url);
      listener(url);
    });
    const shareIntentSubscription = ShareIntentModule?.addListener?.('onStateChange', ({ value }) => {
      console.log('App.js: Share intent state change:', value);
      if (value === 'pending') {
        console.log('App.js: Returning handle-share URL from share intent');
        listener(`${APP_SCHEME}://handle-share`);
      }
    });

    return () => {
      console.log('App.js: Cleaning up subscriptions');
      shareIntentSubscription?.remove?.();
      urlSubscription.remove();
    };
  },
};

export default function App() {
  return (
    <ShareIntentProvider options={SHARE_INTENT_OPTIONS}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer
            linking={linking}
            ref={(navigator) => setNavigationRef(navigator)}
          >
            <AppNavigator />
            {/* <StatusBar style="auto" /> */}
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </ShareIntentProvider>
  );
}
