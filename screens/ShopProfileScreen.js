import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, TextInput, RefreshControl, Linking } from 'react-native';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import Header from '../components/Header';
import { shop, payouts } from '../services/api';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { SvgXml } from 'react-native-svg';
import { SafeAreaView } from "react-native-safe-area-context";

const ShopProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [payoutData, setPayoutData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    category: '',
    description: '',
    logo: null,
    instagram: '',
    pinterest: '',
    youtube: '',
    website: '',
    foundedYear: '',
    lifetimeSales: '',
    tagLine: '',
    knownFor: '',
    yourStory: '',
    storefrontStory: '',
    bankAccountName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: '',
    accountHolderName: '',
    payoutFrequency: 'Weekly',
    minPayoutAmount: ''
  });

  useEffect(() => {
    fetchShopData();
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const response = await payouts.getPayouts();
      console.log('Payout response:', response);
      
      // Mock data for testing if API returns empty
      let payoutList = response?.payouts || [];
      if (payoutList.length === 0) {
        // payoutList = [
        //   {
        //     id: 1,
        //     amount: 2500.00,
        //     status: 'COMPLETED',
        //     payout_date: '2026-02-25T10:30:00Z',
        //     transaction_id: 'TXN123456789',
        //     bank_account: '****1234',
        //     payment_method: 'Bank Transfer',
        //     processing_fee: 25.00,
        //     net_amount: 2475.00,
        //     remarks: 'Monthly payout February 2026'
        //   },
        //   {
        //     id: 2,
        //     amount: 1800.00,
        //     status: 'PROCESSING',
        //     payout_date: '2026-02-28T14:15:00Z',
        //     transaction_id: 'TXN123456790',
        //     bank_account: '****1234',
        //     payment_method: 'Bank Transfer',
        //     processing_fee: 18.00,
        //     net_amount: 1782.00,
        //     remarks: 'Monthly payout February 2026 - Processing'
        //   },
        //   {
        //     id: 3,
        //     amount: 3200.00,
        //     status: 'FAILED',
        //     payout_date: '2026-02-20T09:45:00Z',
        //     transaction_id: 'TXN123456791',
        //     bank_account: '****1234',
        //     payment_method: 'Bank Transfer',
        //     processing_fee: 32.00,
        //     net_amount: 3168.00,
        //     remarks: 'Bank account verification failed'
        //   }
        // ];
      }
      setPayoutData(payoutList);
    } catch (error) {
      console.error('Error fetching payout data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShopData();
    await fetchPayoutData();
    setRefreshing(false);
  };

  const fetchShopData = async () => {
    try {
      setLoading(true);
      const response = await shop.getMyShop();
      console.log('shop response============', JSON.stringify(response))
      
      // Extract shop data from nested response
      const shopResponse = response?.shop || {};
      
      setShopData(shopResponse);
      setFormData({
        name: shopResponse?.name || '',
        email: shopResponse?.email || '',
        phone: shopResponse?.phone || '',
        whatsapp: shopResponse?.whatsapp || '',
        address: shopResponse?.address || '',
        city: shopResponse?.city || '',
        category: shopResponse?.category || '',
        description: shopResponse?.description || '',
        website: shopResponse?.website_url || '',
        foundedYear: shopResponse?.founded_year ? shopResponse.founded_year.toString() : '',
        lifetimeSales: shopResponse?.claimed_lifetime_sales ? shopResponse.claimed_lifetime_sales.toString() : '',
        tagLine: shopResponse?.tagline || '',
        knownFor: shopResponse?.known_for || '',
        yourStory: shopResponse?.story || '',
        bankAccountName: shopResponse?.payout_ifsc_code || '',
        accountNumber: shopResponse?.payout_account_number || '',
        upiId: shopResponse?.payout_upi_id || ''
      });
      
    } catch (error) {
      console.error('Error fetching shop data:', error);
      Alert.alert('Error', 'Failed to load shop data');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData({ ...formData, logo: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // API call to update shop data
      await shop.createOrUpdateShop(formData);
      setShopData({ ...shopData, ...formData });
      setIsEditing(false);
      Alert.alert('Success', 'Shop profile updated successfully');
    } catch (error) {
      console.error('Error updating shop:', error);
      Alert.alert('Error', 'Failed to update shop profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: shopData?.name || '',
      email: shopData?.email || '',
      phone: shopData?.phone || '',
      whatsapp: shopData?.whatsapp || '',
      address: shopData?.address || '',
      city: shopData?.city || '',
      category: shopData?.category || '',
      description: shopData?.description || '',
      logo: shopData?.logo || null,
      instagram: shopData?.instagram || '',
      pinterest: shopData?.pinterest || '',
      youtube: shopData?.youtube || '',
      website: shopData?.website || '',
      foundedYear: shopData?.founded_year || '',
      lifetimeSales: shopData?.lifetime_sales || '',
      tagLine: shopData?.tag_line || '',
      knownFor: shopData?.known_for || '',
      yourStory: shopData?.your_story || '',
      storefrontStory: shopData?.storefront_story || '',
      bankAccountName: shopData?.bank_account_name || '',
      accountNumber: shopData?.account_number || '',
      ifscCode: shopData?.ifsc_code || '',
      upiId: shopData?.upi_id || '',
      accountHolderName: shopData?.account_holder_name || '',
      payoutFrequency: shopData?.payout_frequency || 'Weekly',
      minPayoutAmount: shopData?.min_payout_amount || ''
    });
    setIsEditing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'PROCESSING':
        return '#FF9800';
      case 'FAILED':
        return '#F44336';
      case 'PENDING':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'check-circle';
      case 'PROCESSING':
        return 'clock';
      case 'FAILED':
        return 'times-circle';
      case 'PENDING':
        return 'hourglass-half';
      default:
        return 'question-circle';
    }
  };

  const renderPayoutItem = (item) => (
    <View key={item.id} style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View style={styles.payoutAmount}>
          <Text style={styles.amountText}>₹{item.amount?.toFixed(2) || '0.00'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <FontAwesome5 
              name={getStatusIcon(item.status)} 
              size={12} 
              color="#fff" 
              style={styles.statusIcon} 
            />
            <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
      </View>

      <View style={styles.payoutDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction ID:</Text>
          <Text style={styles.detailValue}>{item.transaction_ref || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>{item.payment_method || 'Bank Transfer'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bank Account:</Text>
          <Text style={styles.detailValue}>{item.bank_account || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Processing Fee:</Text>
          <Text style={styles.detailValue}>₹{item.processing_fee?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Net Amount:</Text>
          <Text style={[styles.detailValue, styles.netAmount]}>₹{item.net_amount?.toFixed(2) || '0.00'}</Text>
        </View>
        {item.remarks && (
          <View style={styles.remarksRow}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        )}
      </View>

      {item.status === 'FAILED' && (
        <View style={styles.failedAlert}>
          <FontAwesome name="exclamation-triangle" size={16} color="#F44336" />
          <Text style={styles.failedText}>Payment failed. Please check your bank details.</Text>
        </View>
      )}
    </View>
  );

  const downloadQR = async (uri) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required to save image");
        return;
      }

      // If it's a remote URL → download first
      let localUri = uri;
      if (uri.startsWith("http")) {
        const fileUri = FileSystem.documentDirectory + "qr-code.png";
        const download = await FileSystem.downloadAsync(uri, fileUri);
        localUri = download.uri;
      }

      await MediaLibrary.saveToLibraryAsync(localUri);
      Alert.alert("Success", "QR Code saved to gallery");
    } catch (err) {
      console.log(err);
    }
  };

  const shareQR = async (uri) => {
    try {
      let localUri = uri;

      if (uri.startsWith("http")) {
        const fileUri = FileSystem.documentDirectory + "qr-code.png";
        const download = await FileSystem.downloadAsync(uri, fileUri);
        localUri = download.uri;
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Sharing not available on this device");
        return;
      }

      await Sharing.shareAsync(localUri, {
        mimeType: "image/png",
        dialogTitle: "Share QR Code",
      });
    } 
    catch (err) {
      console.log(err);
    }
  };

  if (loading && !shopData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading shop profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header 
          title="Shop Profile"
          onNotificationPress={() => console.log('Notification pressed')}
          onProfilePress={() => navigation.navigate('userProfile')}
        />
        <View style={styles.content}>
          {/* Shop Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              {formData.logo ? (
                <Image source={{ uri: formData.logo }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <FontAwesome5 name="store" size={40} color="#ccc" />
                </View>
              )}
              {isEditing && (
                <TouchableOpacity style={styles.cameraButton} onPress={handleImagePick}>
                  <FontAwesome name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.shopName}>{formData.name || 'Shop Name'}</Text>
          </View>

          {/* Profile Information */}
          <View style={styles.profileSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text>Unified shop identity</Text>
                <Text style={styles.sectionTitle}>Shop Profile</Text>
                <Text style={styles.sectionDescription}>This powers your single QR code and your bio-link storefront</Text>
              </View>
              {!isEditing ? (
                <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                  <FontAwesome5 name="edit" size={14} color="#000" />
                  {/* <Text style={styles.editButtonText}>Edit</Text> */}
                </TouchableOpacity>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="store" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Shop Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder="Enter shop name"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.name || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="envelope" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Email</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      placeholder="Enter email"
                      keyboardType="email-address"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.email || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="phone" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.phone || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="whatsapp" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>WhatsApp</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.whatsapp}
                      onChangeText={(text) => setFormData({ ...formData, whatsapp: text })}
                      placeholder="Enter WhatsApp number"
                      keyboardType="phone-pad"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.whatsapp || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="map-marker-alt" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Address</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.address}
                      onChangeText={(text) => setFormData({ ...formData, address: text })}
                      placeholder="Enter address"
                      multiline
                      numberOfLines={3}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.address || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="city" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>City</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.city}
                      onChangeText={(text) => setFormData({ ...formData, city: text })}
                      placeholder="Enter city"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.city || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="tag" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Category</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.category}
                      onChangeText={(text) => setFormData({ ...formData, category: text })}
                      placeholder="Enter category"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.category || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="info-circle" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Description</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Enter shop description"
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.description || 'No description provided'}</Text>
                  )}
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="globe" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Website</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.website}
                      onChangeText={(text) => setFormData({ ...formData, website: text })}
                      placeholder="https://yourwebsite.com"
                      keyboardType="url"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.website || 'Not specified'}</Text>
                  )}
                </View>
              </View>
              </View>
              <View style={styles.infoRow}>
                <Text>Storefront story</Text>
              </View>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="calendar" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Founded Year</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.foundedYear}
                      onChangeText={(text) => setFormData({ ...formData, foundedYear: text })}
                      placeholder="e.g., 2020"
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.foundedYear || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="chart-line" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Lifetime Sales</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.lifetimeSales}
                      onChangeText={(text) => setFormData({ ...formData, lifetimeSales: text })}
                      placeholder="e.g., ₹50,000"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.lifetimeSales || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="tag" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tag Line</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.tagLine}
                      onChangeText={(text) => setFormData({ ...formData, tagLine: text })}
                      placeholder="Your shop's tag line"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.tagLine || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="star" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Known For</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.knownFor}
                      onChangeText={(text) => setFormData({ ...formData, knownFor: text })}
                      placeholder="What your shop is known for"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.knownFor || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="book-open" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Your Story</Text>
                  {isEditing ? (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.yourStory}
                      onChangeText={(text) => setFormData({ ...formData, yourStory: text })}
                      placeholder="Tell your shop's story"
                      multiline
                      numberOfLines={4}
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.yourStory || 'No story provided'}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Payout Settings Section */}
          <View style={styles.payoutSettingsSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.sectionTitle}>Payout settings</Text>
                <Text style={styles.sectionDescription}>Manage your bank details and payout preferences</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
                <FontAwesome5 name="edit" size={14} color="#000" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="bank" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>IFSC Code</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.bankAccountName || ''}
                      onChangeText={(text) => setFormData({ ...formData, bankAccountName: text })}
                      placeholder="Enter IFSC Code"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.bankAccountName || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="credit-card" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Account Number</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.accountNumber || ''}
                      onChangeText={(text) => setFormData({ ...formData, accountNumber: text })}
                      placeholder="Enter account number"
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.accountNumber ? `****${formData.accountNumber.slice(-4)}` : 'Not specified'}</Text>
                  )}
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="university" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>UPI ID</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.upiId || ''}
                      onChangeText={(text) => setFormData({ ...formData, upiId: text })}
                      placeholder="Enter upi id"
                      autoCapitalize="characters"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.upiId || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="user" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Account Holder Name</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.accountHolderName || ''}
                      onChangeText={(text) => setFormData({ ...formData, accountHolderName: text })}
                      placeholder="Enter account holder name"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.accountHolderName || 'Not specified'}</Text>
                  )}
                </View>
              </View>

              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="clock" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Payout Frequency</Text>
                  {isEditing ? (
                    <View style={styles.pickerContainer}>
                      <Text style={styles.pickerLabel}>Select frequency:</Text>
                      <TouchableOpacity style={styles.pickerButton}>
                        <Text style={styles.pickerText}>{formData.payoutFrequency || 'Weekly'}</Text>
                        <FontAwesome5 name="chevron-down" size={12} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>{formData.payoutFrequency || 'Weekly'}</Text>
                  )}
                </View>
              </View>
  */}
              {/* <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <FontAwesome5 name="money-bill-wave" size={16} color="#666" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Minimum Payout Amount</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={formData.minPayoutAmount || ''}
                      onChangeText={(text) => setFormData({ ...formData, minPayoutAmount: text })}
                      placeholder="Enter minimum amount"
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.infoValue}>{formData.minPayoutAmount ? `₹${formData.minPayoutAmount}` : 'Not specified'}</Text>
                  )}
                </View>
              </View> */}
            </View>
          </View>

          {/* Bio Link Section */}
          <View style={styles.bioLinkSection}>
            <View style={styles.bioLinkCard}>
              <View style={styles.bioLinkHeader}>
                <View style={styles.bioLinkContent}>
                  <Text style={styles.bioLinkTitle}>Bio-Link</Text>
                  <Text style={styles.bioLinkUrl}>{shopData?.bio_link || 'e-kom.io/yourshop'}</Text>
                </View>
                <View style={styles.bioLinkActions}>
                  <TouchableOpacity style={styles.copyBioButton} onPress={() => {
                    Clipboard.setStringAsync(shopData?.bio_link || 'e-kom.io/yourshop');
                    Alert.alert('Copied!', 'Bio link copied to clipboard');
                  }}>
                    <FontAwesome5 name="copy" size={14} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.openBioButton} onPress={() => {
                    const link = shopData?.bio_link || 'https://e-kom.io/yourshop';
                    Alert.alert(
                      'Open Link',
                      'Do you want to open this link in your browser?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Open', 
                          onPress: () => {
                            Linking.openURL(link).catch(err => {
                              console.error('Failed to open URL:', err);
                              Alert.alert('Error', 'Unable to open the link');
                            });
                          }
                        }
                      ]
                    );
                  }}>
                    <FontAwesome5 name="external-link-alt" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrCodeSection}>
            {/* <Text style={styles.sectionTitle}>QR Code</Text> */}
            <View style={styles.qrCodeCard}>
              <View style={styles.qrCodeHeader}>
                <View style={styles.qrCodeIcon}>
                  <FontAwesome5 name="qrcode" size={20} color="#000" />
                </View>
                <View style={styles.qrCodeContent}>
                  <Text style={styles.qrCodeTitle}>Shop QR Code</Text>
                  <Text style={styles.qrCodeSubtitle}>One code for all your products</Text>
                </View>
              </View>
              <View style={styles.qrCodeImageContainer}>
                {qrImageUrl ? (
                  <SvgXml
                    xml={qrImageUrl}
                    width={150}
                    height={150}
                    style={styles.qrCodeImage}
                  />
                ) : (
                  <View style={styles.qrCodePlaceholder}>
                    <FontAwesome5 name="qrcode" size={60} color="#ccc" />
                    <Text style={styles.qrCodePlaceholderText}>Loading QR Code...</Text>
                  </View>
                )}
              </View>
              <View style={styles.qrCodeActions}>
                <TouchableOpacity style={styles.qrActionButton} onPress={() => downloadQR(qrImageUrl)}>
                  <FontAwesome5 name="download" size={14} color="#fff" />
                  <Text style={styles.qrActionText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.qrActionButton} onPress={() => shareQR(qrImageUrl)}>
                  <FontAwesome5 name="whatsapp" size={14} color="#fff" />
                  <Text style={styles.qrActionText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Payout History Section */}
          <View style={styles.payoutSection}>
            <View style={styles.payoutHeader}>
              <Text style={styles.sectionTitle}>Payout History</Text>
              <View style={styles.payoutSummary}>
                <Text style={styles.payoutSummaryText}>
                  Total: ₹{payoutData.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
                </Text>
              </View>
            </View>
            
            {payoutData.length === 0 ? (
              <View style={styles.emptyPayoutContainer}>
                <FontAwesome5 name="money-bill-wave" size={40} color="#ccc" />
                <Text style={styles.emptyText}>No payout history found</Text>
                <Text style={styles.emptySubText}>Your payout records will appear here</Text>
              </View>
            ) : (
              payoutData.slice(0, 3).map(renderPayoutItem) // Show only first 3 payouts
            )}
            
            {payoutData.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>View All Payouts</Text>
                <FontAwesome5 name="chevron-right" size={12} color="#000" />
              </TouchableOpacity>
            )}
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  logoSection: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  shopName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  profileSection: {
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  cancelButtonText: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  saveButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  infoContainer: {
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#000',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionsSection: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
  // Payout Section Styles
  payoutSection: {
    marginBottom: 30,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  payoutSummary: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  payoutSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  payoutCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payoutAmount: {
    flex: 1,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  payoutDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  netAmount: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  remarksRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  remarksLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 12,
    color: '#000',
    fontStyle: 'italic',
  },
  failedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  failedText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  emptyPayoutContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  // Payout Settings Section Styles
  payoutSettingsSection: {
    marginBottom: 30,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
  },
  pickerText: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginRight: 8,
  },
  // Bio Link Section Styles
  bioLinkSection: {
    marginBottom: 30,
  },
  bioLinkCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bioLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bioLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bioLinkContent: {
    flex: 1,
  },
  bioLinkTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bioLinkUrl: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  copyBioButton: {
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  bioLinkActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openBioButton: {
    backgroundColor: '#4CAF50',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bioDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  // QR Code Section Styles
  qrCodeSection: {
    marginBottom: 30,
  },
  qrCodeCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  qrCodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  qrCodeContent: {
    flex: 1,
  },
  qrCodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  qrCodeSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  qrCodeImageContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  qrCodeImage: {
    backgroundColor: '#fff',
  },
  qrCodePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 150,
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qrCodePlaceholderText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  qrCodeActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  qrActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  qrActionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});

export default ShopProfileScreen;
