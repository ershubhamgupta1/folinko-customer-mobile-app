import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { Image } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { SvgXml } from "react-native-svg";
import Header from '../components/Header';
import { shop } from '../services/api';

const HomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState(null);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const uniqueLink = 'e-kom.io/yourshop';

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      // Don't show loading indicator if just refreshing
      if (!refreshing) {
        setLoading(true);
      }
      const shopResponse = await shop.getMyShop();
      let qrCode = await shop.getQRCode();
      qrCode = qrCode?.replace(/svg:/g, "")
      .replace(/xmlns:svg="[^"]*"/g, "");

      setShopData(shopResponse);
      setQrImageUrl(qrCode)
    } catch (error) {
      console.error('Error fetching shop data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchShopData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading shop data...</Text>
      </View>
    );
  }
  const downloadQR = async (svgString) => {
    try {
      // Skip permission request for now and save to documents directory
      const fileName = "qr-code.png";
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Convert SVG to file (for now, we'll create a simple file)
      // In a real implementation, you'd use a library to convert SVG to PNG
      await FileSystem.writeAsStringAsync(fileUri, svgString, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      Alert.alert("Success", "QR Code saved to device");
    } catch (err) {
      console.error("Error saving QR code:", err);
      Alert.alert("Error", "Failed to save QR code");
    }
  };
  const shareQR = async (svgString) => {
    try {
      const fileName = "qr-code.svg";
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Save SVG as a file
      await FileSystem.writeAsStringAsync(fileUri, svgString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available on this device");
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "image/svg+xml",
        dialogTitle: "Share QR Code",
      });
    } catch (err) {
      console.error("Error sharing QR code:", err);
      Alert.alert("Error", "Failed to share QR code");
    }
  };
  const handleCopy = async () => {
    await Clipboard.setStringAsync(uniqueLink);
    setCopied(true);
  };
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Header 
        title={shopData?.name || 'E-KOM'}
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('userProfile')}
      />
      <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate('dashboard')}>
      <Text style={styles.sectionTitle}>Dashboard</Text>

      </TouchableOpacity>


      <View style={styles.content}>
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Your Shop QR</Text>
          <Text style={styles.sectionDescription}>One code for all your products</Text>

          <View style={styles.qrPlaceholder}>
            <View style={styles.qrWrapper}>
            <SvgXml
              xml={qrImageUrl}
              width={150}
              style={styles.qrImage}
              height={150}
            />
            </View>
          </View>
          <View style={styles.qrButtons}>
            <TouchableOpacity style={styles.qrButton} onPress={() => downloadQR(qrImageUrl)}>
              <View style={styles.qrButtonContent}>
                <FontAwesome5 name="download" size={14} color="#fff" />
                <Text style={styles.qrButtonText}>Download</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.qrButton} onPress={() => shareQR(qrImageUrl)}>
              <View style={styles.qrButtonContent}>
                <FontAwesome5 name="whatsapp" size={14} color="#fff" />
                <Text style={styles.qrButtonText}>Share</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bioSection}>
          <Text style={{...styles.sectionTitle}}>BIO-LINK FOR SOCIALS</Text>
          <View style={styles.bioLink}>
            <View style={styles.bioUrlContainer}>
              <Text style={styles.bioUrlTitle}>YOUR UNIQUE LINK</Text>
              <Text style={styles.bioUrl}>{shopData.shop.bio_link}</Text>
            </View>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                <FontAwesome5 name="copy" size={12} color="#fff"/>
            </TouchableOpacity>
          </View>
          <Text style={styles.bioDescription}>
            Add this to your Instagram or TikTok bio to drive traffic.
          </Text>
        </View>

        <View style={styles.howToSection}>
          <Text style={styles.sectionTitle}>HOW TO USE</Text>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Print & Engrave</Text>
              <Text style={styles.stepDescription}>Print the QR Code and place it on your shop counter or product packaging.</Text>
            </View>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Social Traffic</Text>
              <Text style={styles.stepDescription}>Paste your Bio-Link in your Instagram profile to let followers browse your full inventory. </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.stickerSection}>
        <View style={styles.stickerCard}>
          <View style={styles.stickerContent}>
            <FontAwesome5 style={styles.stickerIcon} name="print" size={24} color="#fff" solid />
            <View style={styles.stickerInfo}>
              <Text style={styles.stickerTitle}>Need custom stickers?</Text>
              <Text style={styles.stickerDescription}>
                Order high-quality QR stickers for your shop front.
              </Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#666" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: 5,
    color: '#666',
    fontSize: 14, 
    fontWeight: '400', 
  },
  sectionDescription: {
    fontSize: 12,
    marginBottom: 20,
    color: '#666',
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
   qrWrapper: {
    padding: 20,
    backgroundColor: "white",
    borderRadius: 16,
    elevation: 4, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  qrImage: {
  },
  qrButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  qrButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  qrButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  bioSection: {
    marginBottom: 40,
  },
  bioLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  bioUrlContainer: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  bioUrlTitle: {
    fontSize: 10,
    color: '#666',
  },
  bioUrl: {
    fontSize: 14,
    color: '#000',
  },
  copyButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copyText: {
    color: '#fff',
    fontSize: 12,
  },
  bioDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  howToSection: {
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    marginTop: 5
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    color: '#000',
  },
  stepDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  stickerSection: {
    marginBottom: 30,
    marginHorizontal: 15
  },
  stickerCard: {
    backgroundColor: '#f59e0b',
    padding: 20,
    borderRadius: 12,
  },
  stickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stickerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  stickerInfo: {
    flex: 1,
    marginRight: 20
  },
  stickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  stickerDescription: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default HomeScreen;
