import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { cart } from "../services/api";

const CartScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [qtyByItemId, setQtyByItemId] = useState({});

  const openProductDetail = (productId) => {
    navigation.navigate("productDetail", { productId });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCart({ isRefresh: true });
  }, []);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async ({ isRefresh } = {}) => {
    if (!isRefresh) setLoading(true);
    setError("");

    try {
      const response = await cart.get();
      const nextItems = Array.isArray(response?.items) ? response.items : [];
      setCartItems(nextItems);
      setSubtotalAmount(Number(response?.subtotal_amount || 0));

      const nextQty = {};
      nextItems.forEach((it) => {
        nextQty[String(it?.id)] = String(it?.quantity ?? 1);
      });
      setQtyByItemId(nextQty);
    } catch (e) {
      setError(e?.message || "Failed to load cart");
      setCartItems([]);
      setSubtotalAmount(0);
      setQtyByItemId({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const deliveryAmount = useMemo(() => {
    return cartItems.reduce((sum, it) => {
      const fee = Number(it?.post?.delivery_fee_amount || 0);
      return sum + fee;
    }, 0);
  }, [cartItems]);

  const totalAmount = useMemo(() => {
    return Number(subtotalAmount || 0) + Number(deliveryAmount || 0);
  }, [subtotalAmount, deliveryAmount]);

  const formatMoney = (amount) => {
    if (amount === null || amount === undefined) return "";
    return `₹ ${amount}`;
  };

  const onChangeQty = (itemId, v) => {
    const next = String(v || "").replace(/[^0-9]/g, "");
    setQtyByItemId((prev) => ({ ...prev, [String(itemId)]: next }));
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Cart Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.smallLabel}>Shopping</Text>
              <Text style={styles.title}>Cart</Text>
              <Text style={styles.subtitle}>
                Review your order, delivery address, and payment method.
              </Text>
            </View>

            <TouchableOpacity style={styles.browseBtn}>
              <Text>Browse</Text>
            </TouchableOpacity>
          </View>

          {!!error && (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Couldn’t load cart</Text>
              <Text style={styles.stateSubtitle}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchCart()}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading && !error && (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Loading...</Text>
            </View>
          )}

          {!loading && !error && cartItems.length === 0 && (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Your cart is empty</Text>
              <Text style={styles.stateSubtitle}>Add items to proceed to checkout.</Text>
            </View>
          )}

          {!loading && !error && cartItems.map((item) => {
            const post = item?.post;
            const imageUrl = post?.images?.[0]?.url || "https://images.unsplash.com/photo-1603252109303-2751441dd157";
            const title = post?.title || "Item";
            const seller = post?.shop?.name || "";
            const price = Number(post?.price || 0);
            const quantity = Number(item?.quantity || 1);
            const itemTotal = price * quantity;
            const itemId = String(item?.id);

            return (
              <TouchableOpacity
                key={itemId}
                activeOpacity={0.92}
                style={styles.productCard}
                onPress={() => openProductDetail(post?.id)}
              >
                <Image source={{ uri: imageUrl }} style={styles.image} />

                <View style={styles.productContent}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.productName} numberOfLines={1}>{title}</Text>
                    <TouchableOpacity style={styles.viewBtn} onPress={() => openProductDetail(post?.id)}>
                      <Text>View</Text>
                    </TouchableOpacity>
                  </View>

                  {!!seller && <Text style={styles.seller} numberOfLines={1}>{seller}</Text>}

                  <View style={styles.trustBox}>
                    <Text>🛡 Trust</Text>
                    <View style={styles.progressBar}>
                      <View style={styles.progressFill} />
                    </View>
                  </View>

                  <Text style={styles.price}>{formatMoney(price)}</Text>

                  <View style={styles.removeRow}>
                    <TouchableOpacity style={styles.removeBtn}>
                      <Text>Remove</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.qtyRow}>
                    <Text style={styles.qtyLabel}>Qty</Text>

                    <TextInput
                      value={qtyByItemId[itemId] ?? String(quantity)}
                      onChangeText={(v) => onChangeQty(itemId, v)}
                      keyboardType="numeric"
                      style={styles.qtyInput}
                    />

                    <TouchableOpacity style={styles.updateBtn}>
                      <Text>Update</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemTotalText}>{`Item total: ${itemTotal}`}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.smallLabel}>Summary</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.summaryText}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatMoney(subtotalAmount)}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.summaryText}>Delivery</Text>
            <Text style={styles.summaryValue}>{formatMoney(deliveryAmount)}</Text>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.totalText}>Total</Text>
            <Text style={styles.totalValue}>{formatMoney(totalAmount)}</Text>
          </View>

          <TouchableOpacity style={styles.checkoutBtn}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  card: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 16,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  smallLabel: {
    color: "#888",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#666",
    marginTop: 4,
  },

  browseBtn: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  productCard: {
    flexDirection: "row",
    marginTop: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 12,
  },

  image: {
    width: 90,
    height: 110,
    borderRadius: 12,
  },

  productContent: {
    flex: 1,
    marginLeft: 12,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productName: {
    fontSize: 18,
    fontWeight: "600",
  },

  seller: {
    color: "#666",
    marginTop: 4,
  },

  trustBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },

  progressBar: {
    width: 100,
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

  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 6,
  },

  viewBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  removeBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  removeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  qtyLabel: {
    color: "#333",
  },

  qtyInput: {
    borderWidth: 1,
    width: 50,
    textAlign: "center",
    borderRadius: 10,
    padding: 6,
    marginHorizontal: 8,
  },

  updateBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  itemTotalText: {
    color: "#666",
    marginTop: 12,
  },

  summaryCard: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 20,
    padding: 16,
  },

  stateBox: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },

  stateTitle: {
    fontSize: 14,
    fontWeight: "600",
  },

  stateSubtitle: {
    marginTop: 6,
    color: "#666",
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

  summaryText: {
    color: "#666",
    fontSize: 16,
  },

  summaryValue: {
    fontWeight: "600",
    fontSize: 16,
  },

  totalText: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },

  checkoutBtn: {
    backgroundColor: "#f5a623",
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    alignItems: "center",
  },

  checkoutText: {
    color: "#fff",
    fontWeight: "600",
  }
});

export default CartScreen;