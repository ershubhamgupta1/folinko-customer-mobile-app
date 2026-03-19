import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Switch, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { FontAwesome5 } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import AddPhotoBox from '../components/AddPhotoBox';

const SettingsScreen = ({ navigation }) => {
  const { logout } = useAuth();
  const [autoDecrement, setAutoDecrement] = useState(true);
  const [lowStockNotification, setLowStockNotification] = useState(false);
  const [image, setImage] = useState(null);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };
  const takePhoto = async () => {
    // Ask camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission required", "Camera permission is required.");
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };
  return (
    <ScrollView style={styles.container}>
      <Header
        title="Settings"
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('userProfile')}
      />
      <View style={styles.content}>
        <View style={styles.trustMeterSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trust Meter</Text>
            <Text style={styles.sectionSubtitle}>Get verified to unlock 'Blue Tick'</Text>
          </View>
          <View style={styles.statusTag}>
            <Text style={styles.statusText}>STATUS: PENDING</Text>
          </View>
        </View>
        <View style={styles.trustCard}>
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.trustScore}>65%</Text>
            <Text style={styles.trustScoreTitle}>Trust Score</Text>
          </View>
          <Text style={styles.trustDescription}>Complete 2 more steps to reach 100% and get your badge.</Text>
        </View>

        <View style={styles.gstSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10 }}>
            <FontAwesome5 style={{ flex: 1 }} name="file-alt" size={20} color="#555" />
            <Text style={{ ...styles.sectionTitle, flex: 10, fontSize: 14 }}>GST Number</Text>
            <FontAwesome5 style={{ flex: 1 }} name="check-circle" size={20} color="#555" />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value="22AAAAA0000A1Z5"
              editable={false}
            />
          </View>
        </View>
        <View style={styles.gstSection}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 10 }}>
            <FontAwesome5 style={{ flex: 1 }} name="store" size={20} color="#555" />
            <Text style={{ ...styles.sectionTitle, paddingLeft: 10, flex: 10, fontSize: 14 }}>Physical Shop Photo</Text>
            <Text style={{ fontSize: 10 }}>Action Required</Text>
          </View>
          <TouchableOpacity style={styles.imageUploadContainer} onPress={takePhoto}>
            {image ? (
              <Image source={{ uri: image }} style={styles.imageUploadImage} />
            ) : (
              <AddPhotoBox title={'Upload storefront with signage'} icon={<FontAwesome5 name="camera" size={28} color="#888" />} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.gstSection}>
          <View style={{ flexDirection: 'row', marginBottom: 10, width: '100%' }}>
            <FontAwesome5 name="instagram" size={20} color="#666" />
            <Text style={{ ...styles.sectionTitle, fontSize: 14, paddingLeft: 10 }}>Social Media Verification</Text>
          </View>
          <TextInput
            style={{ ...styles.input, borderColor: '#e0e0e0', borderWidth: 1, width: '100%', borderRadius: 6 }}
            placeholder="Instagram Profile Link"
            placeholderTextColor="#999"
          />
          <Text style={styles.note}>Must have {'>'}10k followers for automatic verification.</Text>
        </View>

        <TouchableOpacity style={styles.submitButton}>
          <Feather name="send" size={16} color="#fff" />
          <Text style={styles.submitText}>Submit for Review</Text>
        </TouchableOpacity>
        <Text style={styles.reviewNote}>Review typically takes 24-48 hours</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  trustMeterSection: {
    marginBottom: 15,
    flexDirection: 'row'
  },
  sectionHeader: {
    flex: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  statusTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 15,
    flex: 1
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  trustCard: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    flex: 1
  },
  trustScore: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  trustScoreTitle: {
    fontSize: 14,
    paddingTop: 20,
    textAlignVertical: 'center',
    paddingLeft: 10,
    color: '#666'
  },
  trustDescription: {
    fontSize: 10,
    color: '#ccc',
    lineHeight: 18,
  },
  gstSection: {
    marginBottom: 30,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',

  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  checkIcon: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 12,
    color: '#000',
  },
  photoSection: {
    marginBottom: 30,
    borderRadius: 16,
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'solid',

  },
  actionTag: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  cameraIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  uploadText: {
    fontSize: 14,
    color: '#666',
  },
  socialSection: {
    marginBottom: 30,
  },
  note: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  submitIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingLeft: 6,
  },
  reviewNote: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 30,
  },
  inventorySection: {
    marginBottom: 30,
  },
  refreshIcon: {
    padding: 4,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#000',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 30,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  imageUploadContainer: {
    height: 150,
    width: '100%',
    // borderWidth: 2,
    // borderColor: "#ccc",
    // borderStyle: "dashed",
    // borderRadius: 12,
    // padding: 30,
    // justifyContent: "center",
    // alignItems: "center",
  },
  imageUploadPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imageUploadText: {
    marginTop: 10,
    color: "#777",
    fontSize: 14,
  },
  imageUploadImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
});

export default SettingsScreen;
