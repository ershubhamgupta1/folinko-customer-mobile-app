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
import Header from "../components/Header";
import { cart } from "../services/api";

const CartScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartItems, setCartItems] = useState([]);
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [qtyByItemId, setQtyByItemId] = useState({});
  const [updatingItemId, setUpdatingItemId] = useState("");
  const [removingItemId, setRemovingItemId] = useState("");

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

  const handleUpdateItemQuantity = async (postId, itemId, currentQuantity) => {
    const targetPostId = String(postId || "");
    const targetItemId = String(itemId || "");
    const nextQuantity = Number.parseInt(qtyByItemId[targetItemId] ?? String(currentQuantity ?? ""), 10);

    if (!targetPostId) {
      setError("Failed to update this cart item.");
      return;
    }

    if (!Number.isFinite(nextQuantity) || nextQuantity < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    if (nextQuantity === Number(currentQuantity || 0)) {
      return;
    }

    try {
      setUpdatingItemId(targetItemId);
      setError("");

      const response = await cart.updateQuantity(targetPostId, { quantity: nextQuantity });

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to update cart item");
      }

      await fetchCart({ isRefresh: true });
    } catch (e) {
      setError(e?.message || "Failed to update cart item");
    } finally {
      setUpdatingItemId("");
    }
  };

  const handleRemoveItem = async (postId) => {
    const targetPostId = String(postId || "");

    if (!targetPostId) {
      setError("Failed to remove this cart item.");
      return;
    }

    try {
      setRemovingItemId(targetPostId);
      setError("");

      const response = await cart.remove(targetPostId);

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to remove cart item");
      }

      await fetchCart({ isRefresh: true });
    } catch (e) {
      setError(e?.message || "Failed to remove cart item");
    } finally {
      setRemovingItemId("");
    }
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
          title="Cart"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
        />

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

            <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate("Feed")}>
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
            const postId = String(post?.id || "");
            const nextQtyValue = qtyByItemId[itemId] ?? String(quantity);
            const parsedNextQty = Number.parseInt(nextQtyValue, 10);
            const isUpdating = updatingItemId === itemId;
            const isRemoving = removingItemId === postId;
            const isUpdateDisabled =
              isUpdating ||
              !postId ||
              !Number.isFinite(parsedNextQty) ||
              parsedNextQty < 1 ||
              parsedNextQty === quantity;

            return (
              <TouchableOpacity
                key={itemId}
                activeOpacity={0.92}
                style={styles.productCard}
                onPress={() => openProductDetail(post?.id)}
              >
                <View style={styles.productMediaColumn}>
                  <Image source={{ uri: imageUrl }} style={styles.image} />
                  <View style={styles.qtyColumn}>
                    <View style={styles.qtyInlineRow}>
                      <Text style={styles.qtyLabel}>Qty</Text>

                      <TextInput
                        value={nextQtyValue}
                        onChangeText={(v) => onChangeQty(itemId, v)}
                        keyboardType="numeric"
                        style={styles.qtyInput}
                        editable={!isUpdating}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.updateBtn, isUpdateDisabled && styles.updateBtnDisabled]}
                      onPress={() => handleUpdateItemQuantity(postId, itemId, quantity)}
                      disabled={isUpdateDisabled}
                    >
                      <Text style={styles.updateBtnText}>{isUpdating ? "Updating..." : "Update"}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.productContent}>
                  <View style={styles.productTopSection}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.productName} numberOfLines={1}>{title}</Text>
                      {/* <TouchableOpacity style={styles.viewBtn} onPress={() => openProductDetail(post?.id)}>
                        <Text style={styles.viewBtnText}>View</Text>
                      </TouchableOpacity> */}
                    </View>

                    {!!seller && <Text style={styles.seller} numberOfLines={1}>{seller}</Text>}

                    <View style={styles.trustBox}>
                      <Text style={styles.trustText}>🛡 Trust</Text>
                      <View style={styles.progressBar}>
                        <View style={styles.progressFill} />
                      </View>
                    </View>
                  <TouchableOpacity
                    style={[styles.removeBtn, isRemoving && styles.removeBtnDisabled]}
                    onPress={() => handleRemoveItem(postId)}
                    disabled={isRemoving}
                  >
                    <Text style={styles.removeBtnText}>{isRemoving ? "Removing..." : "Remove"}</Text>
                  </TouchableOpacity>


                  </View>

                  <View style={styles.itemSummaryCard}>
                    <View style={styles.itemSummaryRow}>
                      <Text style={styles.itemSummaryLabel}>Price</Text>
                      <Text style={styles.itemSummaryPrice}>{formatMoney(price)}</Text>
                    </View>

                    {/* <View style={styles.itemSummaryDivider} /> */}

                    {/* <View style={styles.itemSummaryRow}>
                      <Text style={styles.itemSummaryLabel}>Qty</Text>
                      <Text style={styles.itemSummaryValue}>{quantity}</Text>
                    </View> */}

                    <View style={styles.itemSummaryDivider} />

                    <View style={styles.itemSummaryRow}>
                      <Text style={styles.itemSummaryLabel}>Item total</Text>
                      <Text style={styles.itemSummaryValue}>{formatMoney(itemTotal)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary */}
        {
          cartItems.length > 0 &&
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

            <TouchableOpacity style={styles.checkoutBtn} onPress={() => navigation.navigate("checkoutScreen")}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        }
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
    marginBottom: 8,
    fontSize: 16
  },

  title: {
    fontSize: 18,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },

  productMediaColumn: {
    width: 112,
    alignItems: "stretch",
  },

  image: {
    width: 112,
    height: 126,
    borderRadius: 18,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  productContent: {
    flex: 1,
    marginLeft: 14,
    minHeight: 224,
    justifyContent: "flex-start",
  },

  productTopSection: {
    paddingTop: 4,
    minHeight: 126,
    paddingBottom: 10,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  productName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    color: "#101828",
    flex: 1,
    marginRight: 8,
  },

  seller: {
    color: "#667085",
    marginTop: 6,
    fontSize: 13,
    fontWeight: "500",
  },

  trustBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  trustText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },

  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#D0D5DD",
    borderRadius: 10,
    marginLeft: 8,
    width: 88,
    maxWidth: 88,
  },

  progressFill: {
    width: "70%",
    height: 6,
    backgroundColor: "#22c55e",
    borderRadius: 10,
  },

  viewBtn: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  viewBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  removeBtn: {
    borderWidth: 1,
    borderColor: "#FED7AA",
    backgroundColor: "#FFF7ED",
    // paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 10,
  },
  removeBtnDisabled: {
    opacity: 0.6,
  },

  removeBtnText: {
    fontSize: 12,
    color: "#C2410C",
    fontWeight: "600",
  },

  qtyColumn: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAECF0",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  qtyInlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  qtyLabel: {
    color: "#475467",
    fontSize: 12,
    marginRight: 8,
    fontWeight: "600",
  },

  qtyInput: {
    borderWidth: 1,
    width: 54,
    textAlign: "center",
    borderRadius: 10,
    borderColor: "#D0D5DD",
    backgroundColor: "#F9FAFB",
    padding: 6,
    fontSize: 12,
  },

  updateBtn: {
    borderWidth: 1,
    borderColor: "#111827",
    backgroundColor: "#111827",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: "center",
    marginTop: 10,
  },
  updateBtnDisabled: {
    opacity: 0.6,
  },

  updateBtnText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  itemSummaryCard: {
    backgroundColor: "#FFFCF5",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F3E8D6",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flex: 1,
    justifyContent: "center",
  },

  itemSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemSummaryDivider: {
    height: 1,
    backgroundColor: "#F1E4CC",
    marginTop: 10,
    marginBottom: 10,
  },

  itemSummaryLabel: {
    color: "#667085",
    fontSize: 11,
    fontWeight: "500",
  },

  itemSummaryValue: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
  },

  itemSummaryPrice: {
    color: "#B54708",
    fontSize: 12,
    fontWeight: "700",
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
    fontSize: 12,
  },

  summaryValue: {
    fontWeight: "600",
    fontSize: 14,
  },

  totalText: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },

  totalValue: {
    fontSize: 14,
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