import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

/* ===================== DESIGN TOKENS ===================== */
const COLORS = {
  bg: "#f4efe9",
  white: "#fff",
  textPrimary: "#111827",
  textSecondary: "#4b5563",
  textMuted: "#6b7280",
  border: "#e5e7eb",
  light: "#f3f4f6",
  accent: "#f59e0b",
};

const SPACING = {
  sm: 8,
  md: 12,
  lg: 16,
};

/* ===================== BASE STYLES ===================== */
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

  label: {
    fontSize: 13,
    color: COLORS.textMuted,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
});

/* ===================== COMPONENTS ===================== */

const OrderHeaderCard = () => (
  <View style={base.card}>
    <View style={styles.topRow}>
      <View style={{ flex: 1 }}>
        <Text style={base.label}>Order</Text>
        <Text style={styles.orderId}>#4</Text>
        <Text style={styles.subText}>Placed 2026-03-02</Text>
        <Text style={styles.email}>Customer: smridh@tandev.us</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.pill}>
          <Ionicons name="document-text-outline" size={18} />
          <Text style={styles.pillText}>Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pill}>
          <Ionicons name="arrow-back" size={18} />
          <Text style={styles.pillText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const OrderItemCard = () => (
  <View style={base.card}>
    <Text style={base.title}>Items (your shop)</Text>

    <View style={styles.itemCard}>
      <Image
        source={{
          uri: "https://instagram.fixc11-1.fna.fbcdn.net/v/t51.82787-15/619600416_18077553527360525_1576591170252182596_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MjcwODEwMzA5NTM2Nzc1NTMwMQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTgwMC5zZHIuQzMifQ%3D%3D&_nc_ohc=z51EFAUBRvAQ7kNvwFM2uEs&_nc_oc=Adkb1-kcGq5rbYiEICyuHGTD99n1SwVT3Bo15f9XxhNU8k7NJWZkd3NXfN_J-4t_Q3I&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fixc11-1.fna&_nc_gid=UD5HQuYsn4MsOiaVXVQOow&oh=00_AfsX2M1M46B8vEDA_uUBpl6YmD8T9xgbxwx-6CffrYBr3A&oe=69A4D136",
        }}
        style={styles.image}
      />

      <View style={styles.content}>
        <Text style={styles.itemTitle}>Saree 2</Text>

        <View style={base.rowBetween}>
          <View>
            <Text style={base.label}>Unit price</Text>
            <Text style={base.value}>INR 2099</Text>
          </View>

          <View>
            <Text style={base.label}>Qty</Text>
            <Text style={base.value}>1</Text>
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={base.label}>Line total</Text>
          <Text style={base.value}>INR 2099</Text>
        </View>
      </View>
    </View>
  </View>
);

const FulfillmentCard = () => {
  const [status, setStatus] = useState("Created");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  return (
    <View style={base.card}>
      <Text style={base.title}>Fulfillment</Text>

      <Text style={base.label}>Status</Text>
      <TouchableOpacity style={styles.dropdown}>
        <Text style={styles.dropdownText}>{status}</Text>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Text style={base.label}>Tracking code</Text>
      <TextInput
        placeholder="E.g. DELH123456"
        placeholderTextColor="#9ca3af"
        value={trackingCode}
        onChangeText={setTrackingCode}
        style={styles.input}
      />

      <Text style={styles.helper}>
        Required when status is Shipped/Delivered (MVP).
      </Text>

      <Text style={base.label}>Tracking URL (optional)</Text>
      <TextInput
        placeholder="https://..."
        placeholderTextColor="#9ca3af"
        value={trackingUrl}
        onChangeText={setTrackingUrl}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button}>
        <Ionicons name="save-outline" size={18} color={COLORS.textPrimary} />
        <Text style={styles.buttonText}>Save update</Text>
      </TouchableOpacity>
    </View>
  );
};

const SummaryCard = () => (
  <View style={base.card}>
    <Text style={base.title}>Summary</Text>

    <View style={base.rowBetween}>
      <Text style={base.label}>Shop subtotal</Text>
      <Text style={base.value}>₹ 2099</Text>
    </View>

    <View style={[base.rowBetween, { marginTop: 10 }]}>
      <Text style={base.label}>Order status</Text>
      <Text style={base.value}>Created</Text>
    </View>
  </View>
);

/* ===================== MAIN SCREEN ===================== */

export default function OrderDetailScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <OrderHeaderCard />
        <OrderItemCard />
        <FulfillmentCard />
        <SummaryCard />

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

  footer: {
    textAlign: "center",
    color: "#aaa",
    marginVertical: 20,
  },

  /* HEADER */
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  orderId: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },

  subText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  email: {
    fontSize: 14,
    color: "#2563eb",
  },

  actions: {
    flexDirection: "row",
    gap: 10,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.light,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 30,
  },

  pillText: {
    fontSize: 15,
    fontWeight: "500",
  },

  /* ITEM */
  itemCard: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  image: {
    width: 72,
    height: 90,
    borderRadius: 16,
    marginRight: 14,
  },

  content: {
    flex: 1,
  },

  itemTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
    color: COLORS.textPrimary,
  },

  /* INPUT */
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 30,
    padding: 14,
    fontSize: 16,
    marginTop: 6,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 30,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  dropdownText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  helper: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 6,
  },

  button: {
    marginTop: 16,
    borderRadius: 30,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.accent,
  },

  buttonText: {
    fontWeight: "600",
  },
});