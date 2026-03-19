import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Header from "../components/Header";
import { analytics, shop } from "../services/api";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

/* ===================== TOKENS ===================== */
const COLORS = {
  bg: "#f9fafb",
  card: "#ffffff",
  border: "#e5e7eb",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",

  successBg: "#dcfce7",
  successText: "#22c55e",

  warningBg: "#ffedd5",
  warningText: "#f97316",
};

const SPACING = {
  sm: 8,
  md: 12,
  lg: 16,
};

/* ===================== BASE ===================== */
const base = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  description: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginVertical: 8,
    lineHeight: 20,
  },
});

/* ===================== SMALL COMPONENTS ===================== */
const ProTipCard = () => (
  <View style={base.card}>
    <Text style={styles.smallTitle}>Pro tip</Text>

    <Text style={styles.proTipText}>
      Add 3 high-quality images per product. Use “Material” + “Price” for instant trust.
    </Text>
  </View>
);

const StatCard = ({ title, desc, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statDesc}>{desc}</Text>
  </View>
);

const Badge = ({ type = "success", icon, text }) => {
  const isSuccess = type === "success";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isSuccess ? COLORS.successBg : COLORS.warningBg },
      ]}
    >
      <Ionicons
        name={icon}
        size={16}
        color={isSuccess ? COLORS.successText : COLORS.warningText}
      />
      <Text
        style={[
          styles.badgeText,
          { color: isSuccess ? COLORS.successText : COLORS.warningText },
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

const AccountCard = ({ shopData }) => {
  const shopStatus = shopData?.verification_status || 'PENDING';

  return (
  <View style={base.card}>
    <Text style={base.label}>Account</Text>
    {/* <Text style={styles.email}>{shopData?.email || 'Loading...'}</Text> */}

    <View style={styles.innerCard}>
      <Text style={styles.sectionTitle}>Shop status</Text>

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

      <Text style={styles.url}>
        {shopData?.bio_link || 'Loading...'}
      </Text>

      <View style={styles.promotedRow}>
        <Badge type="warning" icon="rocket-outline" text="Promoted" />

        <Text style={styles.promotedDesc}>
          Shown first in customer trending feed
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Remove promotion</Text>
        <Ionicons name="chevron-down" size={18} />
      </TouchableOpacity>
    </View>
  </View>
);
};

/* ===================== MAIN SCREEN ===================== */

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [shopData, setShopData] = useState({});

  useEffect(() => {
    fetchSummaryData();
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      const response = await shop.getMyShop();
      let qrCode = await shop.getQRCode();
      qrCode = qrCode?.replace(/svg:/g, "")
      .replace(/xmlns:svg="[^"]*"/g, "");

      // Extract shop data from nested response
      const shopResponse = response?.shop || {};
      setShopData(shopResponse);
    } catch (error) {
      console.error('Error fetching shop data:', error);
    }
  };

  const fetchSummaryData = async () => {
    try {
      const res = await analytics.getSummary();
      console.log('res==========', res);
      setMetrics(res?.metrics || {});
    } catch (e) {
      console.error(e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummaryData();
    await fetchShopData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header
          title="Dashboard"
          onNotificationPress={() => {}}
          onProfilePress={() => navigation.navigate("userProfile")}
        />

        <View style={styles.content}>
          {/* NAV */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("feedScreen")}
          >
            <Text style={styles.secondaryButtonText}>Open Feed</Text>
            <Feather name="arrow-right" size={16} />
          </TouchableOpacity>

          {/* QUICK ACTION */}
          <View style={base.card}>
            <Text style={styles.smallTitle}>Quick Actions</Text>
            <Text style={base.title}>Run your storefront like a product</Text>
            <Text style={base.description}>
              Upload social links, add structured product details, and build trust with verification. This is how we kill “DM for price”.
            </Text>

            <View style={styles.statsContainer}>
              <StatCard title="Total Posts" value={metrics.total_posts} desc={'Every post is a structured product card'} />
              <StatCard title="Images" value={metrics.total_images} desc={'Boost conversions with multi-image support'} />
              <StatCard title="Shares" value={metrics.total_shares} desc={'Signal: demand and social proof'} />
            </View>
          </View>

          {/* QR */}
          <View style={base.card}>
            <View style={base.rowBetween}>
              <View>
                <Text style={styles.smallTitle}>Unified Shop Identity</Text>
                <Text style={base.title}>One QR. One link.</Text>
              </View>
              <MaterialIcons name="qr-code" size={24} />
            </View>

            <Text style={base.description}>
              Use a single QR to bridge offline traffic to your video-first storefront.
            </Text>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('shopProfile')}>
              <Text style={styles.secondaryButtonText}>Manage</Text>
              <Feather name="arrow-right" size={16} />
            </TouchableOpacity>
          </View>

          {/* TRUST */}
          <View style={base.card}>
            <View style={base.rowBetween}>
              <View>
                <Text style={styles.smallTitle}>Trust & Verification</Text>
                <Text style={base.title}>Earn the Blue Tick</Text>
              </View>
              <Feather name="check-circle" size={22} />
            </View>

            <Text style={base.description}>
              Submit GST, shop photos, and social proof. Verification unlocks marketplace trust.
            </Text>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('trustMeter')}>
              <Text style={styles.secondaryButtonText}>
                Open Trust Meter
              </Text>
              <Feather name="arrow-right" size={16} />
            </TouchableOpacity>
          </View>

          {/* ACCOUNT */}
          <AccountCard shopData={shopData} />
          <ProTipCard />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  container: {
    flex: 1,
  },

  content: {
    padding: 20,
  },

  smallTitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },

  /* BUTTONS */
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginBottom: 10,
    gap: 6,
  },

  secondaryButtonText: {
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  primaryButton: {
    marginTop: 16,
    borderRadius: 30,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "500",
  },

  /* STATS */
  statsContainer: {
    gap: 10,
    marginTop: 10,
  },

  statBox: {
    backgroundColor: "#f8f8f8",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 4,
  },

  statDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  /* ACCOUNT */
  email: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },

  innerCard: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
  },

  sectionTitle: {
    fontSize: 15,
    marginBottom: 12,
    color: COLORS.textSecondary,
  },

  url: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  promotedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    gap: 10,
  },

  promotedDesc: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "600",
    fontSize: 13,
  },
  proTipText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 24,
  },

  /* VERIFICATION BADGES */
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  verifiedText: {
    color: "#1c7c54",
    fontWeight: "600",
  },

  pendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  pendingText: {
    color: "#dc2626",
    fontWeight: "600",
  },
});