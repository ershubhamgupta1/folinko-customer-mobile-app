import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import VideoPlayer from "../components/VideoPlayer";

/* ===================== TOKENS ===================== */
const COLORS = {
  bg: "#f4efe9",
  white: "#fff",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  light: "#f3f4f6",
};

const SPACING = {
  sm: 8,
  md: 12,
  lg: 16,
};

/* ===================== BASE ===================== */
const base = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    margin: SPACING.md,
    padding: SPACING.lg,
    borderRadius: 20,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  text: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
});

/* ===================== COMPONENTS ===================== */

const BannerCard = () => (
  <View style={base.card}>
    <Text style={styles.smallLabel}>Business Console</Text>
    <Text style={styles.bannerTitle}>
      Build a verified, video-first storefront
    </Text>

    <TouchableOpacity style={styles.qrBtn}>
      <Ionicons name="qr-code-outline" size={18} />
      <Text>QR</Text>
    </TouchableOpacity>
  </View>
);

const UpdateHeaderCard = () => (
  <View style={base.card}>
    <View style={base.rowBetween}>
      <View>
        <View style={styles.row}>
          <View style={styles.dot} />
          <Text style={styles.smallLabel}>Updates</Text>
        </View>

        <Text style={styles.feedTitle}>Folinko Feed</Text>
        <Text style={styles.desc}>
          Announcements, tutorials, and growth tips from the Folinko team.
        </Text>
      </View>

      {/* <View style={styles.iconCircle}>
        <Ionicons name="wifi-outline" size={18} />
      </View> */}
    </View>
  </View>
);

const FeedPostCard = () => (
  <View style={base.card}>
    <Text style={styles.postTitle}>TEST</Text>

    <Text style={styles.meta}>2026-03-10 • Folinko</Text>

    <Text style={styles.desc}>
      We believe this internship will provide you with valuable practical
      exposure and the opportunity to work on meaningful cybersecurity-related
      tasks in a real-world environment.
      {"\n\n"}
      Please find the offer letter below. If you are interested in accepting this
      opportunity, kindly reply to this email confirming your acceptance.
    </Text>

    {/* VIDEO PREVIEW */}
    <View style={styles.videoWrapper}>
      <VideoPlayer />
    </View>

    {/* FOOTER */}
    <View style={[base.rowBetween, { marginTop: 10 }]}>
      <Text style={styles.meta}>Post #1</Text>
      <Text style={styles.meta}>Updated 2026-03-10</Text>
    </View>
  </View>
);

const HowToCard = () => (
  <View style={base.card}>
    <Text style={styles.smallLabel}>How to use</Text>

    <View style={styles.listItem}>
      <Ionicons name="sparkles-outline" size={18} />
      <Text style={styles.listText}>
        Watch tutorials to improve your storefront conversion.
      </Text>
    </View>

    <View style={styles.listItem}>
      <Ionicons name="videocam-outline" size={18} />
      <Text style={styles.listText}>
        New features will be announced here first.
      </Text>
    </View>

    <View style={styles.listItem}>
      <Ionicons name="shield-checkmark-outline" size={18} />
      <Text style={styles.listText}>
        Verification and best practices are shared regularly.
      </Text>
    </View>
  </View>
);

/* ===================== MAIN SCREEN ===================== */

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* <BannerCard /> */}
        <UpdateHeaderCard />
        <FeedPostCard />
        <HowToCard />

        <Text style={styles.footer}>
          © 2026 Social Commerce SaaS • Business Console
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  smallLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },

  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
    color: COLORS.textPrimary,
  },

  qrBtn: {
    position: "absolute",
    right: 16,
    top: 16,
    flexDirection: "row",
    gap: 6,
    backgroundColor: COLORS.light,
    padding: 10,
    borderRadius: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 10,
    backgroundColor: "#fb923c",
  },

  feedTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
    color: COLORS.textPrimary,
  },

  desc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 22,
  },

  iconCircle: {
    backgroundColor: COLORS.light,
    padding: 12,
    borderRadius: 30,
  },

  postTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  meta: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  videoWrapper: {
    marginTop: 12,
    borderRadius: 20,
    // overflow: "hidden",
  },

  video: {
    width: "100%",
    height: 300,
  },

  videoOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
  },

  videoText: {
    color: "#fff",
    fontSize: 13,
  },

  listItem: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    alignItems: "flex-start",
  },

  listText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
  },

  footer: {
    textAlign: "center",
    color: "#aaa",
    marginVertical: 20,
  },
});