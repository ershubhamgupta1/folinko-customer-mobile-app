import { useCallback, useState, useEffect } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import { cart, orders } from "../services/api";

const OrderScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderList, setOrderList] = useState([]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders({ isRefresh: true });
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async ({ isRefresh } = {}) => {
    if (!isRefresh) setLoading(true);
    setError("");

    try {
      const response = await orders.list();

      const nextOrders = Array.isArray(response?.orders) ? response.orders : [];
      setOrderList(nextOrders);
    } catch (e) {
      setError(e?.message || "Failed to load orders");
      setOrderList([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toISOString().slice(0, 10);
  };

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return "";
    return `₹ ${amount}`;
  };

  const getStatusLabel = (order) => {
    return order?.status || order?.order_status || "";
  };

  const getStatusBadgeStyle = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "DELIVERED") return styles.statusBadgeDelivered;
    if (s === "SHIPPED") return styles.statusBadgeShipped;
    if (s === "PACKED") return styles.statusBadgePacked;
    return styles.statusBadgeDefault;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header
          title="Orders"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
        />

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Orders</Text>
          <Text style={styles.pageSubtitle}>Track your purchases and delivery updates.</Text>
        </View>

        {!!error && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Couldn’t load orders</Text>
            <Text style={styles.stateSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrders()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !error && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>Loading...</Text>
          </View>
        )}

        {!loading && !error && orderList.length === 0 && (
          <View style={styles.stateCard}>
            <Text style={styles.stateTitle}>No orders yet</Text>
            <Text style={styles.stateSubtitle}>Your orders will show up here after checkout.</Text>
          </View>
        )}

        {!loading && !error && orderList.map((order) => {
          const statusLabel = getStatusLabel(order);
          const firstItem = order?.first_item;
          const imageUrl =
            firstItem?.photo_url ||
            firstItem?.image_url ||
            firstItem?.thumbnail_url ||
            "https://images.unsplash.com/photo-1603252109303-2751441dd157";
          const title = firstItem?.title || firstItem?.name || "Item";
          const seller = firstItem?.shop_name || firstItem?.shop?.name || firstItem?.seller_name || "";

          return (
            <TouchableOpacity
              key={String(order?.id)}
              style={styles.card}
              activeOpacity={0.9}
              onPress={() => navigation.navigate("orderDetail", { orderId: order?.id, order })}
            >
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.orderId}>#{order?.id}</Text>
                  <Text style={styles.date}>{formatDate(order?.created_at)}</Text>
                  <Text style={styles.updated}>Updated {formatDate(order?.updated_at)}</Text>
                </View>

                <View style={[styles.statusBadge, getStatusBadgeStyle(statusLabel)]}>
                  <Text style={styles.statusText}>{`• ${statusLabel}`}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.productRow}>
                <Image source={{ uri: imageUrl }} style={styles.image} />

                <View style={styles.productContent}>
                  <Text style={styles.itemCount}>{`${order?.item_count || 0} item${order?.item_count === 1 ? "" : "s"}`}</Text>
                  <Text style={styles.productName} numberOfLines={1}>{title}</Text>
                  {!!seller && <Text style={styles.seller} numberOfLines={1}>{seller}</Text>}

                  <View style={styles.trustBox}>
                    <Text>🛡 Trust</Text>
                    <View style={styles.progressBar}>
                      <View style={styles.progressFill} />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.priceRow}>
                <View>
                  <Text style={styles.priceLabel}>Subtotal</Text>
                  <Text style={styles.priceValue}>{formatMoney(order?.subtotal_amount)}</Text>
                </View>

                <View>
                  <Text style={styles.priceLabel}>Delivery</Text>
                  <Text style={styles.priceValue}>{formatMoney(order?.delivery_fee_amount)}</Text>
                </View>

                <View>
                  <Text style={styles.priceLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatMoney(order?.total_amount)}</Text>
                </View>
              </View>

            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  container: {
    flex: 1,
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 16,
  },

  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },

  pageSubtitle: {
    color: "#666",
    marginTop: 4,
  },

  stateCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 16,
  },

  stateTitle: {
    fontSize: 16,
    fontWeight: "600",
  },

  stateSubtitle: {
    color: "#666",
    marginTop: 6,
  },

  retryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: "center",
  },

  retryText: {
    fontWeight: "500",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  orderId: {
    fontSize: 18,
    fontWeight: "bold",
  },

  date: {
    color: "#666",
    marginTop: 2,
  },

  updated: {
    color: "#aaa",
    fontSize: 12,
  },

  statusBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusBadgeDefault: {
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  statusBadgePacked: {
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
  },

  statusBadgeShipped: {
    borderColor: "#93c5fd",
    backgroundColor: "#eff6ff",
  },

  statusBadgeDelivered: {
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
  },

  statusText: {
    fontSize: 12,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },

  productRow: {
    flexDirection: "row",
  },

  image: {
    width: 70,
    height: 90,
    borderRadius: 10,
  },

  productContent: {
    flex: 1,
    marginLeft: 12,
  },

  itemCount: {
    fontSize: 12,
    color: "#888",
  },

  productName: {
    fontSize: 16,
    fontWeight: "600",
  },

  seller: {
    color: "#666",
    marginTop: 2,
  },

  trustBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  progressBar: {
    width: 80,
    height: 6,
    backgroundColor: "#ddd",
    borderRadius: 10,
    marginLeft: 8,
  },

  progressFill: {
    width: "70%",
    height: 6,
    backgroundColor: "#22c55e",
    borderRadius: 10,
  },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  priceLabel: {
    color: "#888",
    fontSize: 12,
  },

  priceValue: {
    fontSize: 16,
    fontWeight: "600",
  },

  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
export default OrderScreen;