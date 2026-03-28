import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";
import { cart, customerAuth, orders, wishlist } from "../services/api";

const FALLBACK_ORDER_IMAGE =
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80";

const getWishlistItems = (response) => {
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.posts)) return response.posts;
  if (Array.isArray(response?.wishlist)) return response.wishlist;
  if (Array.isArray(response?.saved_items)) return response.saved_items;
  if (Array.isArray(response?.products)) return response.products;
  return [];
};

const formatDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return String(iso);
  return date.toISOString().slice(0, 10);
};

const formatMoney = (amount) => {
  return `INR ${Number(amount || 0)}`;
};

const toTitleCase = (value) => {
  return String(value || "Created")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusColors = (status) => {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "DELIVERED") {
    return {
      backgroundColor: "#F0FDF4",
      borderColor: "#BBF7D0",
      color: "#15803D",
    };
  }

  if (normalized === "SHIPPED") {
    return {
      backgroundColor: "#EFF6FF",
      borderColor: "#BFDBFE",
      color: "#1D4ED8",
    };
  }

  return {
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    color: "#374151",
  };
};

const UserProfileScreen = () => {
  const navigation = useNavigation();
  const { logout, user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [orderList, setOrderList] = useState([]);

  const fetchProfileData = async ({ isRefresh } = {}) => {
    if (!isRefresh) setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      customerAuth.getMe(),
      cart.get(),
      wishlist.list(),
      orders.list(),
    ]);

    const [profileRes, cartRes, wishlistRes, ordersRes] = results;

    const fallbackProfile = authUser?.user || authUser || null;

    if (profileRes.status === "fulfilled") {
      setProfile(profileRes.value?.user || profileRes.value || null);
    } else {
      setProfile(fallbackProfile);
      setError(profileRes.reason?.message || "Failed to load account details");
    }

    if (cartRes.status === "fulfilled") {
      setCartItems(Array.isArray(cartRes.value?.items) ? cartRes.value.items : []);
    } else {
      setCartItems([]);
    }

    if (wishlistRes.status === "fulfilled") {
      setWishlistItems(getWishlistItems(wishlistRes.value));
    } else {
      setWishlistItems([]);
    }

    if (ordersRes.status === "fulfilled") {
      setOrderList(Array.isArray(ordersRes.value?.orders) ? ordersRes.value.orders : []);
    } else {
      setOrderList([]);
    }

    if (results.every((item) => item.status === "rejected")) {
      setError("Failed to load account data");
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfileData({ isRefresh: true });
  }, []);

  const email = profile?.email || authUser?.user?.email || authUser?.email || "customer@folinko.com";
  const accountInitial = email.charAt(0).toUpperCase() || "C";

  const summaryCards = useMemo(
    () => [
      { key: "cart", title: "Cart", value: cartItems.length, subtitle: "items" },
      { key: "wishlist", title: "Wishlist", value: wishlistItems.length, subtitle: "saved" },
      { key: "orders", title: "Orders", value: orderList.length, subtitle: "placed" },
    ],
    [cartItems.length, wishlistItems.length, orderList.length]
  );

  const recentOrders = useMemo(() => {
    return [...orderList]
      .sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime())
      .slice(0, 3);
  }, [orderList]);

  const openTab = (screen) => {
    navigation.navigate("Main", { screen });
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    openTab("Feed");
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >

        <View style={styles.mainCard}>
          <Text style={styles.sectionEyebrow}>Account</Text>

          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.pageTitle}>Your account</Text>
              <Text style={styles.pageSubtitle}>Orders, saved items, and checkout history.</Text>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <FontAwesome5 name="arrow-left" size={12} color="#111827" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="small" color="#111827" />
              <Text style={styles.stateTitle}>Loading your account...</Text>
            </View>
          ) : null}

          {!loading && !!error ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>Couldn’t load account completely</Text>
              <Text style={styles.stateSubtitle}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchProfileData()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.accountCard}>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>{accountInitial}</Text>
            </View>

            <View style={styles.accountInfo}>
              <Text style={styles.accountInfoLabel}>Signed in as</Text>
              <Text style={styles.accountEmail}>{email}</Text>
            </View>
          </View>

          <View style={styles.summaryList}>
            {summaryCards.map((item) => (
              <TouchableOpacity
                key={item.key}
                activeOpacity={0.9}
                style={styles.summaryCard}
                onPress={() => {
                  if (item.key === "cart") openTab("cart");
                  if (item.key === "wishlist") openTab("Wishlist");
                  if (item.key === "orders") openTab("Orders");
                }}
              >
                <Text style={styles.summaryTitle}>{item.title}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text style={styles.summarySubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.panelCard}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelEyebrow}>Recent orders</Text>
                <Text style={styles.panelTitle}>Last activity</Text>
              </View>

              <TouchableOpacity style={styles.outlinePill} onPress={() => openTab("Orders")}>
                <Text style={styles.outlinePillText}>View all</Text>
              </TouchableOpacity>
            </View>

            {recentOrders.length ? (
              recentOrders.map((order) => {
                const firstItem = order?.first_item || {};
                const imageUrl =
                  firstItem?.photo_url ||
                  firstItem?.image_url ||
                  firstItem?.thumbnail_url ||
                  FALLBACK_ORDER_IMAGE;
                const statusLabel = toTitleCase(order?.status || order?.order_status || "Created");
                const statusColors = getStatusColors(order?.status || order?.order_status);
                const title = firstItem?.title || firstItem?.name || `Order #${order?.id}`;
                const itemCount = Number(order?.item_count || 0);

                return (
                  <TouchableOpacity
                    key={String(order?.id)}
                    activeOpacity={0.92}
                    style={styles.orderRow}
                    onPress={() => openTab("Orders")}
                  >
                    <Image source={{ uri: imageUrl }} style={styles.orderImage} />

                    <View style={styles.orderContent}>
                      <View style={styles.orderTopRow}>
                        <Text style={styles.orderTitle} numberOfLines={1}>{`Order #${order?.id}`}</Text>
                        <Text style={styles.orderAmount}>{formatMoney(order?.total_amount || order?.subtotal_amount)}</Text>
                      </View>

                      <Text style={styles.orderMeta} numberOfLines={1}>{`${itemCount} item${itemCount === 1 ? "" : "s"} · ${title}`}</Text>
                      <Text style={styles.orderDate}>{formatDate(order?.created_at)}</Text>

                      <View style={[styles.statusPill, { backgroundColor: statusColors.backgroundColor, borderColor: statusColors.borderColor }]}>
                        <Text style={[styles.statusPillText, { color: statusColors.color }]}>{statusLabel}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyStateBox}>
                <Text style={styles.emptyStateTitle}>No recent orders</Text>
                <Text style={styles.emptyStateSubtitle}>Your latest orders will appear here after checkout.</Text>
              </View>
            )}
          </View>

          <View style={styles.panelCard}>
            <Text style={styles.panelEyebrow}>Quick actions</Text>

            <TouchableOpacity style={styles.primaryAction} onPress={() => openTab("Feed")}>
              <Text style={styles.primaryActionText}>Discover</Text>
              <FontAwesome5 name="arrow-right" size={12} color="#111827" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={() => openTab("cart")}>
              <Text style={styles.secondaryActionText}>Go to cart</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={() => openTab("Wishlist")}>
              <Text style={styles.secondaryActionText}>Go to wishlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryAction} onPress={() => openTab("Orders")}>
              <Text style={styles.secondaryActionText}>View orders</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.panelCard}>
            <Text style={styles.panelEyebrow}>Session</Text>

            <TouchableOpacity style={styles.sessionButton} onPress={handleLogout}>
              <Text style={styles.sessionButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F3ECE3",
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandLogo: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  brandSubtitle: {
    fontSize: 10,
    color: "#6B7280",
  },
  logoutTopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoutTopText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  mainCard: {
    backgroundColor: "#FCFAF7",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E6DDD3",
    padding: 14,
  },
  sectionEyebrow: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  stateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 18,
    marginTop: 14,
    alignItems: "center",
  },
  stateTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  stateSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 12,
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  accountCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  accountInfo: {
    marginLeft: 12,
    flex: 1,
  },
  accountInfoLabel: {
    fontSize: 11,
    color: "#6B7280",
  },
  accountEmail: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  summaryList: {
    marginTop: 10,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  summaryTitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  summaryValue: {
    marginTop: 2,
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  summarySubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  panelCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    padding: 14,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  panelEyebrow: {
    fontSize: 11,
    color: "#6B7280",
  },
  panelTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  outlinePill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
  },
  outlinePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  orderImage: {
    width: 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginRight: 12,
  },
  orderContent: {
    flex: 1,
  },
  orderTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  orderTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  orderMeta: {
    marginTop: 4,
    fontSize: 11,
    color: "#6B7280",
  },
  orderDate: {
    marginTop: 2,
    fontSize: 11,
    color: "#6B7280",
  },
  statusPill: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  emptyStateBox: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 12,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  emptyStateSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 18,
  },
  primaryAction: {
    marginTop: 10,
    backgroundColor: "#F9B233",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  secondaryAction: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  sessionButton: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
  },
  sessionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
});

export default UserProfileScreen;