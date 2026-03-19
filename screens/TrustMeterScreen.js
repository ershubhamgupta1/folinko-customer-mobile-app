import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect } from "react";
import { verification } from '../services/api';
import { useNavigation } from "@react-navigation/native";

export default function VerificationScreen() {
  const navigation = useNavigation();

  const [verificationItems, setVerificationItems] = useState([
    // { title: "Verified status", points: 10, done: true },
    // { title: "GST number + documents", points: 20, done: true },
    // { title: "Physical shop photos", points: 15, done: false },
    // { title: "Social proof URL", points: 10, done: true },

    // { title: "Followers (10k+)", points: 5, done: false },
    // { title: "Contact info (phone/email)", points: 5, done: true },
    // { title: "Address + city", points: 5, done: true },
    // { title: "Listings (5+)", points: 5, done: false },
    // { title: "Active recently (30d)", points: 5, done: true },

    // { title: "Low cancellations", points: 10, done: false },
    // { title: "Customer reviews", points: 10, done: false }
  ]);
  
  const [totalScore, setTotalScore] = useState(0);
  const [progress, setProgress] = useState(0);
  const [shopStatus, setShopStatus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(()=>{
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async()=>{
    try {
      const response = await verification.getVerificationStatus();
      
      // Extract data from API response
      const trustMeterData = response?.trust_meter || {};
      const submissionData = response?.submission || {};
      const apiShopStatus = submissionData?.shop_status || null;
      
      // Update verification items with real data
      const updatedVerificationItems = trustMeterData.checks?.map(check => ({
        title: check.label,
        points: check.points,
        done: check.done
      })) || verificationItems;
      
      // Update total score and progress
      const apiTotalScore = trustMeterData.score || 0;
      const apiProgress = apiTotalScore / 100;
      
      // Set state with API data
      setVerificationItems(updatedVerificationItems);
      setTotalScore(apiTotalScore);
      setProgress(apiProgress);
      setShopStatus(apiShopStatus);
      
      // You can use submissionData if needed
    } catch (error) {
      console.error('Error fetching verification status:', error);
    } finally {
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVerificationData();
  }, []);

  const StatusBadge = ({ done }) => (
    <View
      style={[
        styles.badge,
        done ? styles.doneBadge : styles.missingBadge
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          done ? styles.doneText : styles.missingText
        ]}
      >
        {done ? "Done" : "Missing"}
      </Text>
    </View>
  );
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.customHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trust Meter</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.smallTitle}>Trust & Verification</Text>
            {shopStatus === 'VERIFIED' ? (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={16} color="#1c7c54" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Feather name="clock" size={16} color="#dc2626" />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>Blue Tick submission</Text>
          <Text style={styles.description}>
            Manual verification to prevent scams and unlock marketplace trust.
          </Text>
          <View style={styles.trustBox}>

            <View style={styles.rowBetween}>
              <Text style={styles.trustTitle}>Trust meter</Text>
              <Text style={styles.target}>Target: 80+ for fast approval</Text>
            </View>

            <Text style={styles.score}>{totalScore} / 100</Text>

            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progress * 100}%` }]}
              />
            </View>

            {verificationItems.map((item, index) => (
              <View key={index} style={styles.item}>
                <View style={{ flex: 2 }}>
                  <Text style={styles.itemTitle} ellipsizeMode="tail" numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.points}>{item.points} pts</Text>
                </View>

                <StatusBadge done={item.done} />
              </View>
            ))}

          </View>
          {shopStatus === 'VERIFIED' && (
            <View style={styles.successCard}>
              <Text style={styles.successLabel}>Blue Tick</Text>
              <Text style={styles.successText}>
                Your shop is verified. Submission form is disabled.
              </Text>
            </View>
          )}
        </View>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What we verify</Text>
          <View style={styles.verifyRow}>
            <View style={styles.iconCircle}>
              <Feather name="file-text" size={18} />
            </View>

            <View>
              <Text style={styles.verifyTitle}>GST</Text>
              <Text style={styles.verifyDesc}>Business legitimacy</Text>
            </View>
          </View>
          <View style={styles.verifyRow}>
            <View style={styles.iconCircle}>
              <Feather name="camera" size={18} />
            </View>

            <View>
              <Text style={styles.verifyTitle}>Physical shop</Text>
              <Text style={styles.verifyDesc}>Prevents fake sellers</Text>
            </View>
          </View>
          <View style={styles.verifyRow}>
            <View style={styles.iconCircle}>
              <Feather name="users" size={18} />
            </View>

            <View>
              <Text style={styles.verifyTitle}>Social proof</Text>
              <Text style={styles.verifyDesc}>Followers, credibility</Text>
            </View>
          </View>
        </View>
        <View style={[styles.card, { marginBottom: 40 }]}>
          <Text style={styles.sectionTitle}>Note</Text>
          <Text style={styles.noteText}>
            Admin approval/rejection workflow will be built in the Super Admin Hub next.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingBottom: 80
  },

  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 20,
    padding: 18,
    marginVertical: 10,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    color: "#111827"
  },

  description: {
    fontSize: 14,
    color: "#4b5563",
    marginVertical: 10
  },

  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4f5e3",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },

  verifiedText: {
    marginLeft: 5,
    color: "#1c7c54"
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },

  pendingText: {
    marginLeft: 5,
    color: "#dc2626"
  },

  trustBox: {
    backgroundColor: "#f8f8f8",
    marginTop: 14,
    padding: 16,
    borderRadius: 18
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  trustTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  target: {
    fontSize: 12,
    color: "#6b7280"
  },

  score: {
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 8
  },

  progressBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 16
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#f59e0b"
  },

  item: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    overflow: 'hidden',
    // backgroundColor: 'red',
    maxWidth: '90%'

  },

  points: {
    fontSize: 12,
    color: "#6b7280"
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20
  },

  doneBadge: {
    backgroundColor: "#d4f5e3"
  },

  missingBadge: {
    backgroundColor: "#e5e7eb"
  },

  badgeText: {
    fontSize: 12
  },

  doneText: {
    color: "#1c7c54"
  },

  missingText: {
    color: "#6b7280"
  },
  successCard: {
    backgroundColor: "#d7f5e6",
    borderRadius: 20,
    padding: 18,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#9bd9bb"
  },

  successLabel: {
    fontSize: 14,
    color: "#1c7c54",
    marginBottom: 4
  },

  successText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534"
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 14,
    color: "#374151"
  },

  verifyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff"
  },

  verifyTitle: {
    fontSize: 16,
    fontWeight: "600"
  },

  verifyDesc: {
    fontSize: 14,
    color: "#6b7280"
  },

  noteText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 22
  },

  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },

  backButton: {
    padding: 5
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333"
  },

  headerSpacer: {
    width: 34
  }
});