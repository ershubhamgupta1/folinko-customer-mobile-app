import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { orders } from "../services/api";

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
    paddingVertical: SPACING.sm,
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

const OrderHeaderCard = ({ orderData, navigation }) => (
  <View style={base.card}>
    <View style={styles.topRow}>
      <View style={{ flex: 1 }}>
        <Text style={base.label}>Order</Text>
        <Text style={styles.orderId}>#{orderData?.id || 'N/A'}</Text>
        <Text style={styles.subText}>Placed {new Date(orderData?.created_at).toLocaleDateString()}</Text>
        <Text style={styles.email}>Customer: {orderData?.customer?.email || 'N/A'}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.pill}>
          <Ionicons name="document-text-outline" size={18} />
          <Text style={styles.pillText}>Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pill} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} />
          <Text style={styles.pillText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const OrderItemCard = ({ orderData }) => (
  <View style={base.card}>
    <Text style={base.title}>Items (your shop)</Text>

    {orderData?.items?.map((item, index) => (
      <View key={item.id || index} style={styles.itemCard}>
        <Image
          source={{
            uri: item?.post?.image_url || "https://via.placeholder.com/72x90",
          }}
          style={styles.image}
        />

        <View style={styles.content}>
          <Text style={styles.itemTitle}>{item?.post?.title || 'Product'}</Text>

          <View style={base.rowBetween}>
            <View>
              <Text style={base.label}>Unit price</Text>
              <Text style={base.value}>INR {item?.unit_price || '0'}</Text>
            </View>

            <View>
              <Text style={base.label}>Qty</Text>
              <Text style={base.value}>{item?.quantity || '1'}</Text>
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text style={base.label}>Line total</Text>
            <Text style={base.value}>INR {item?.line_total || '0'}</Text>
          </View>
        </View>
      </View>
    ))}
  </View>
);

const FulfillmentCard = ({ orderData }) => {
  const [status, setStatus] = useState(orderData?.fulfillment?.status || "Created");
  const [trackingCode, setTrackingCode] = useState(orderData?.fulfillment?.tracking_code || "");
  const [trackingUrl, setTrackingUrl] = useState(orderData?.fulfillment?.tracking_url || "");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statusOptions = ["Created", "Packed", "Shipped", "Delivered", "Cancelled"];

  const handleStatusSelect = (selectedStatus) => {
    setStatus(selectedStatus);
    setShowStatusDropdown(false);
  };

  return (
    <View style={base.card}>
      <Text style={base.title}>Fulfillment</Text>

      <Text style={base.label}>Status</Text>
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.dropdown}
          onPress={() => setShowStatusDropdown(!showStatusDropdown)}
        >
          <Text style={styles.dropdownText}>{status}</Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Status Dropdown Options */}
        {showStatusDropdown && (
          <View style={styles.dropdownOptions}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={styles.dropdownOption}
                onPress={() => handleStatusSelect(option)}
              >
                <Text style={styles.dropdownOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

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
        placeholder="https://tracking.example.com/..."
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

const SummaryCard = ({ orderData }) => (
  <View style={base.card}>
    <Text style={base.title}>Summary</Text>

    <View style={base.rowBetween}>
      <Text style={base.label}>Shop subtotal</Text>
      <Text style={base.value}>₹ {orderData?.shop_subtotal || '0'}</Text>
    </View>

    <View style={[base.rowBetween, { marginTop: 10 }]}>
      <Text style={base.label}>Order status</Text>
      <Text style={base.value}>{orderData?.order_status || 'Created'}</Text>
    </View>
  </View>
);

/* ===================== MAIN SCREEN ===================== */

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { orderId } = route.params || {};
  
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await orders.getOrder(orderId);
      console.log('Order details response:', JSON.stringify(response));
      setOrderData(response?.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!orderData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load order details</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrderDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <OrderHeaderCard orderData={orderData} navigation={navigation} />
        <OrderItemCard orderData={orderData} />
        <FulfillmentCard orderData={orderData} />
        <SummaryCard orderData={orderData} />

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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },

  retryButton: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  retryButtonText: {
    color: COLORS.white,
    fontWeight: "600",
  },

  dropdownOptions: {
    position: "absolute",
    top: 45, // Position below the dropdown button
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  dropdownContainer: {
    position: "relative",
  },

  dropdownOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  dropdownOptionText: {
    fontSize: 16,
    color: COLORS.textPrimary,
  },
});