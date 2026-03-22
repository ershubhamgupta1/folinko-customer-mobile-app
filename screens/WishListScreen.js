import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { cart, wishlist } from "../services/api";

const FALLBACK_WISHLIST_IMAGE =
  "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80";

const getWishlistItems = (response) => {
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.posts)) return response.posts;
  if (Array.isArray(response?.wishlist)) return response.wishlist;
  if (Array.isArray(response?.saved_items)) return response.saved_items;
  if (Array.isArray(response?.products)) return response.products;
  return [];
};

const WishListScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addingPostId, setAddingPostId] = useState("");
  const [removingPostId, setRemovingPostId] = useState("");
  const [actionFeedback, setActionFeedback] = useState({ postId: "", type: "", message: "" });

  const openProductDetail = (productId) => {
    navigation.navigate("productDetail", { productId });
  };

  const fetchWishlist = useCallback(async ({ isRefresh } = {}) => {
    if (!isRefresh) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await wishlist.list();

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to load wishlist");
      }

      setWishlistItems(getWishlistItems(response));
    } catch (e) {
      setWishlistItems([]);
      setError(e?.message || "Failed to load wishlist");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWishlist({ isRefresh: true });
  }, [fetchWishlist]);

  const handleRemoveWishlistItem = async (postId) => {
    const targetPostId = String(postId || "");

    if (!targetPostId) {
      setError("Failed to remove wishlist item");
      return;
    }

    try {
      setRemovingPostId(targetPostId);
      setError("");

      const response = await wishlist.remove(targetPostId);

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to remove wishlist item");
      }

      await fetchWishlist({ isRefresh: true });
    } catch (e) {
      setError(e?.message || "Failed to remove wishlist item");
    } finally {
      setRemovingPostId("");
    }
  };

  const handleAddToCart = async (postId) => {
    const targetPostId = String(postId || "");

    if (!targetPostId) {
      setActionFeedback({ postId: targetPostId, type: "error", message: "Product not available for cart." });
      return;
    }

    try {
      setAddingPostId(targetPostId);
      setActionFeedback({ postId: "", type: "", message: "" });

      const response = await cart.add(targetPostId, { quantity: 1 });

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to add product to cart.");
      }

      setActionFeedback({ postId: targetPostId, type: "success", message: "Added to cart." });
    } catch (e) {
      setActionFeedback({
        postId: targetPostId,
        type: "error",
        message: e?.message || "Failed to add product to cart.",
      });
    } finally {
      setAddingPostId("");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header
          title="Wishlist"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wishlist</Text>
          <Text style={styles.subtitle}>
            Items you saved for later
          </Text>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator size="small" color="#111827" />
            <Text style={styles.stateTitle}>Loading wishlist...</Text>
          </View>
        ) : null}

        {!loading && !!error ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Couldn’t load wishlist</Text>
            <Text style={styles.stateSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchWishlist()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!loading && !error && wishlistItems.length === 0 ? (
          <View style={styles.stateBox}>
            <Text style={styles.stateTitle}>Your wishlist is empty</Text>
            <Text style={styles.stateSubtitle}>Save items to view them here later.</Text>
          </View>
        ) : null}

        {!loading && !error && wishlistItems.map((item, index) => {
          const post = item?.post || item?.product || item;
          const postId = String(post?.id || item?.post_id || item?.id || "");
          const itemId = String(post?.id || item?.post_id || item?.id || index);
          const isAdding = addingPostId === postId;
          const isRemoving = removingPostId === postId;
          const title = post?.title || item?.title || item?.name || "Item";
          const seller = post?.shop?.name || item?.seller || item?.shop?.name || "";
          const price = Number(post?.price || item?.price || 0);
          const imageUrl =
            post?.cover_image_url ||
            post?.images?.[0]?.url ||
            item?.image ||
            FALLBACK_WISHLIST_IMAGE;

          return (
            <TouchableOpacity
              key={itemId}
              activeOpacity={0.92}
              style={styles.card}
              onPress={() => postId && openProductDetail(postId)}
            >
              <Image source={{ uri: imageUrl }} style={styles.image} />

              <View style={styles.content}>
                <Text style={styles.productName}>{title}</Text>
                <Text style={styles.seller}>{seller}</Text>

                <Text style={styles.price}>₹ {price}</Text>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.addBtn, isAdding && styles.actionBtnDisabled]}
                    onPress={() => handleAddToCart(postId)}
                    disabled={isAdding}
                  >
                    <Text style={styles.addText}>{isAdding ? "Adding..." : "Add to cart"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.removeBtn, isRemoving && styles.actionBtnDisabled]}
                    onPress={() => handleRemoveWishlistItem(postId)}
                    disabled={isRemoving}
                  >
                    <Text>{isRemoving ? "Removing..." : "Remove"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => postId && openProductDetail(postId)}>
                    <Text>View</Text>
                  </TouchableOpacity>
                </View>

                {actionFeedback.postId === postId && !!actionFeedback.message ? (
                  <Text
                    style={[
                      styles.actionFeedbackText,
                      actionFeedback.type === "error" && styles.actionFeedbackErrorText,
                    ]}
                  >
                    {actionFeedback.message}
                  </Text>
                ) : null}
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

  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stateBox: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  stateTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
  },
  stateSubtitle: {
    marginTop: 6,
    color: "#6B7280",
    textAlign: "center",
  },
  retryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryText: {
    color: "#111827",
    fontWeight: "600",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#666",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 420,
  },

  content: {
    padding: 14,
  },

  productName: {
    fontSize: 18,
    fontWeight: "600",
  },

  seller: {
    color: "#666",
    marginTop: 4,
  },

  price: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
  },

  actions: {
    flexDirection: "row",
    marginTop: 12,
  },

  addBtn: {
    backgroundColor: "#f5a623",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  actionBtnDisabled: {
    opacity: 0.6,
  },

  addText: {
    color: "#fff",
    fontWeight: "600",
  },

  removeBtn: {
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  removeBtnDisabled: {
    opacity: 0.6,
  },
  actionFeedbackText: {
    marginTop: 10,
    fontSize: 12,
    color: "#166534",
    fontWeight: "600",
  },
  actionFeedbackErrorText: {
    color: "#B42318",
  },
});

export default WishListScreen;