import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ShareIntentModule, useShareIntentContext } from 'expo-share-intent';
import { posts } from '../services/api';

const extractUrlFromText = (value = '') => {
  const match = value.match(/https?:\/\/\S+/i);
  return match ? match[0].replace(/[),.;!?]+$/, '') : '';
};

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
};

const getUniqueValues = (values = []) => Array.from(new Set(values.filter((value) => (value || '').trim() !== '')));

const hasIntentPayload = (shareIntent = {}) => {
  return !!(
    shareIntent?.webUrl ||
    shareIntent?.text ||
    shareIntent?.meta?.title ||
    shareIntent?.meta?.['og:image'] ||
    shareIntent?.files?.length
  );
};

const buildSharedDraftFromIntent = (shareIntent = {}) => {
  const sharedText = shareIntent?.text || '';
  const socialUrl = shareIntent?.webUrl || extractUrlFromText(sharedText);
  const cleanedText = sharedText.replace(/https?:\/\/\S+/gi, '').replace(/\s+/g, ' ').trim();

  return {
    socialUrl,
    text: cleanedText || sharedText,
  };
};

const HandleShareScreen = () => {
  const navigation = useNavigation();
  const handledRef = useRef(false);
  const waitTimeoutRef = useRef(null);
  const navigationRef = useRef(false);
  const { error, hasShareIntent, isReady, resetShareIntent, shareIntent } = useShareIntentContext();
  const hasNativePayload = hasIntentPayload(shareIntent);

  useEffect(() => {
    if (handledRef.current) {
      return;
    }

    const nativeModuleMissing = !ShareIntentModule;
    const intentDraft = hasNativePayload ? buildSharedDraftFromIntent(shareIntent) : null;
    const sharedDraft = intentDraft || {};

    if (!isReady && !nativeModuleMissing && !error) {
      return;
    }

    if (!nativeModuleMissing && !error && !hasNativePayload) {
      if (!waitTimeoutRef.current) {
        waitTimeoutRef.current = setTimeout(() => {
          waitTimeoutRef.current = null;
          // Force check after timeout
          handledRef.current = true;
          if (!navigationRef.current) {
            navigationRef.current = true;
            setTimeout(() => {
              navigation.replace('feedScreen');
            }, 100);
          }
        }, 3000);
      }
      return;
    }

    handledRef.current = true;

    if (waitTimeoutRef.current) {
      clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }

    if (hasShareIntent || hasNativePayload) {
      resetShareIntent();
    }

    const run = async () => {
      try {
        const sharedUrl = String(sharedDraft?.socialUrl || '').trim();

        if (sharedUrl) {
          const response = await posts.lookupByUrl(sharedUrl);
          console.log('Lookup response:', response);
          
          const postId =
            response?.post_id ??
            response?.postId ??
            response?.id ??
            response?.post?.id;

          console.log('Extracted postId:', postId);

          if (postId) {
            // Prevent multiple navigation calls
            if (navigationRef.current) {
              console.log('Navigation already in progress, skipping');
              return;
            }
            navigationRef.current = true;
            
            // Small delay to ensure navigation is ready
            setTimeout(() => {
              navigation.replace('productDetail', { productId: postId });
            }, 100);
          } else {
            if (navigationRef.current) {
              console.log('Navigation already in progress, skipping');
              return;
            }
            navigationRef.current = true;
            
            setTimeout(() => {
              navigation.replace('feedScreen', { sharedUrl: sharedUrl });
            }, 100);
          }
        } else {
          if (navigationRef.current) {
            console.log('Navigation already in progress, skipping');
            return;
          }
          navigationRef.current = true;
          
          setTimeout(() => {
            navigation.replace('feedScreen');
          }, 100);
        }
      } catch (error) {
        console.log('Share intent error:', error);
        
        if (!navigationRef.current) {
          navigationRef.current = true;
          setTimeout(() => {
            navigation.replace('feedScreen');
          }, 100);
        }
      }
    };

    run();
  }, [error, hasNativePayload, hasShareIntent, isReady, navigation, resetShareIntent, shareIntent]);

  useEffect(() => {
    return () => {
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
      }
    };
  }, []);

  const subtitle = error
    ? 'We could not read the shared content.'
    : (!isReady || !hasNativePayload) && ShareIntentModule
      ? 'Reading shared content.'
      : 'Looking up product...';

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#111827" />
      <Text style={styles.title}>Processing shared post...</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f9fafb',
  },
  title: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
  },
});

export default HandleShareScreen;
