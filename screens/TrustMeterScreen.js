import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput } from "react-native";
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
  const [submission, setSubmission] = useState(null);

  const [gstNumber, setGstNumber] = useState("");
  const [gstDocumentUrl, setGstDocumentUrl] = useState("");
  const [socialProofUrl, setSocialProofUrl] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [shopPhotoUrls, setShopPhotoUrls] = useState([""]);

  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(()=>{
    fetchVerificationData();
  }, []);

  const buildPayload = () => {
    const cleanedShopPhotoUrls = (shopPhotoUrls || [])
      .map((u) => (u || "").trim())
      .filter(Boolean);

    return {
      gst_number: (gstNumber || "").trim(),
      gst_document_url: (gstDocumentUrl || "").trim(),
      shop_photo_urls: cleanedShopPhotoUrls,
      social_proof_url: (socialProofUrl || "").trim(),
      follower_count: followerCount === "" ? null : Number(followerCount),
    };
  };

  const validateForSubmit = (payload) => {
    if (!payload.gst_number) return "GST number is required.";
    if (!payload.gst_document_url) return "GST certificate URL is required.";
    if (!payload.social_proof_url) return "Social proof URL is required.";
    if (!payload.follower_count || Number.isNaN(payload.follower_count)) return "Follower count is required.";
    if (!Array.isArray(payload.shop_photo_urls) || payload.shop_photo_urls.length === 0) return "At least 1 shop photo URL is required.";
    return null;
  };

  const handleSaveDraft = async () => {
    try {
      if (savingDraft || submitting) return;
      setSavingDraft(true);
      const payload = buildPayload();
      await verification.saveDraft(payload);
      Alert.alert("Saved", "Draft saved successfully");
      fetchVerificationData();
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert("Error", "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      if (savingDraft || submitting) return;
      setSubmitting(true);
      const payload = buildPayload();
      const validationError = validateForSubmit(payload);
      if (validationError) {
        Alert.alert("Validation", validationError);
        return;
      }
      await verification.submitForReview(payload);
      Alert.alert("Submitted", "Submitted for review successfully");
      fetchVerificationData();
    } catch (error) {
      console.error('Error submitting for review:', error);
      Alert.alert("Error", "Failed to submit for review");
    } finally {
      setSubmitting(false);
    }
  };

  const updateShopPhotoUrl = (index, value) => {
    setShopPhotoUrls((prev) => {
      const next = [...(prev || [])];
      next[index] = value;
      return next;
    });
  };

  const addShopPhotoUrl = () => {
    setShopPhotoUrls((prev) => ([...(prev || []), ""]));
  };

  const hydrateFormFromSubmission = (submission) => {
    if (!submission) return;

    setGstNumber(submission?.gst_number || "");
    setGstDocumentUrl(submission?.gst_document_url || "");
    setSocialProofUrl(submission?.social_proof_url || "");
    setFollowerCount(
      submission?.follower_count !== null && submission?.follower_count !== undefined
        ? String(submission.follower_count)
        : ""
    );

    const urls = Array.isArray(submission?.shop_photo_urls)
      ? submission.shop_photo_urls.filter(Boolean)
      : [];
    setShopPhotoUrls(urls.length > 0 ? urls : [""]);
  };

  const fetchVerificationData = async()=>{
    try {
      const response = await verification.getVerificationStatus();
      
      // Extract data from API response
      const trustMeterData = response?.trust_meter || {};
      const submissionData = response?.submission || {};
      console.log('response==============', response);
      const apiShopStatus = response?.shop_status || null;
      
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

      setSubmission(submissionData);
      hydrateFormFromSubmission(submissionData);
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
  console.log('shopStatus=========', shopStatus);

  const submissionStatus =
    submission?.status ||
    submission?.submission_status ||
    null;

  const effectiveStatus = shopStatus || submissionStatus;

  const isInReview =
    effectiveStatus === 'SUBMITTED' ||
    !!submission?.submitted_at;

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
            {effectiveStatus === 'VERIFIED' ? (
              <View style={styles.verifiedBadge}>
                <Feather name="check-circle" size={16} color="#1c7c54" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : isInReview ? (
              <View style={styles.inReviewBadge}>
                <Feather name="clock" size={16} color="#b45309" />
                <Text style={styles.inReviewText}>In Review</Text>
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
          {shopStatus !== 'VERIFIED' && (
            <View style={styles.card}>

              {/* GST NUMBER */}
              <Text style={styles.inputLabel}>GST number</Text>
              <TextInput
                placeholder="GSTIN"
                style={styles.input}
                placeholderTextColor="#9ca3af"
                value={gstNumber}
                onChangeText={setGstNumber}
              />

              {/* GST URL */}
              <Text style={styles.inputLabel}>GST certificate URL</Text>
              <TextInput
                placeholder="https://..."
                style={styles.input}
                placeholderTextColor="#9ca3af"
                value={gstDocumentUrl}
                onChangeText={setGstDocumentUrl}
              />

              {/* SOCIAL PROOF */}
              <Text style={styles.inputLabel}>Social proof URL</Text>
              <TextInput
                placeholder="Instagram profile / press / etc"
                style={styles.input}
                placeholderTextColor="#9ca3af"
                value={socialProofUrl}
                onChangeText={setSocialProofUrl}
              />

              {/* FOLLOWERS */}
              <Text style={styles.inputLabel}>Follower count</Text>
              <TextInput
                placeholder="10000"
                style={styles.input}
                keyboardType="numeric"
                placeholderTextColor="#9ca3af"
                value={followerCount}
                onChangeText={setFollowerCount}
              />

              {/* SHOP PHOTOS */}
              <View style={styles.uploadCard}>
                <View style={styles.rowBetween}>
                  <View style={{width:'70%'}}>
                    <Text style={styles.uploadTitle}>Physical shop photos</Text>
                    <Text style={styles.uploadDesc}>
                      Paste photo URLs for now (GCS uploads coming).
                    </Text>
                  </View>
            
                  <TouchableOpacity style={styles.addBtn} onPress={addShopPhotoUrl}>
                    <Text style={styles.addBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {shopPhotoUrls.map((url, idx) => (
                  <TextInput
                    key={idx}
                    placeholder="https://..."
                    style={styles.input}
                    placeholderTextColor="#9ca3af"
                    value={url}
                    onChangeText={(text) => updateShopPhotoUrl(idx, text)}
                  />
                ))}
              </View>

              {/* ACTION BUTTONS */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={handleSaveDraft} disabled={savingDraft || submitting}>
                  {savingDraft ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Text style={styles.secondaryBtnText}>Save draft</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmitForReview} disabled={savingDraft || submitting}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#111827" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Submit for review</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* NOTE */}
              <Text style={styles.warningText}>
                Upload your Shop QR to your Instagram Highlights. Admin verification is approved only after checking your Instagram page for that QR highlight (fraud prevention).
              </Text>

            </View>
          )}
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
      {/* ================= FORM SECTION ================= */}
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
    padding: 8,
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

  inReviewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20
  },

  inReviewText: {
    marginLeft: 5,
    color: "#b45309"
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
  },




  inputLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 14,
  },

  input: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 14,
  },

  uploadCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  uploadTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  uploadDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },

  addBtn: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  addBtnText: {
    fontSize: 13,
    fontWeight: "500",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "white",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  secondaryBtnText: {
    fontWeight: "600",
    color: "#111827",
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    // paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
  },

  primaryBtnText: {
    fontWeight: "600",
    color: "#111827",
  },

  warningText: {
    marginTop: 14,
    fontSize: 12,
    color: "#dc2626",
    lineHeight: 18,
  },  
});