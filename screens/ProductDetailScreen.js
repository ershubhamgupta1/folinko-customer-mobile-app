import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { posts } from "../services/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80";

const SIZE_OPTIONS = ["S", "M", "L", "XL"];

const formatMoney = (amount) => {
  const numericAmount = Number(amount || 0);
  return `INR ${numericAmount}`;
};

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { logout } = useAuth();
  const productId = route.params?.productId ?? route.params?.id;
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("Select");
  const [showSizeOptions, setShowSizeOptions] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [relatedProductsData, setRelatedProductsData] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError("Product not found");
        setProductData(null);
        setRelatedProductsData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [response, relatedRes] = await Promise.all([
          posts.getById(productId),
          posts.related(productId).catch(() => ({ posts: [] })),
        ]);
        setProductData(response?.post || null);
        setRelatedProductsData(Array.isArray(relatedRes?.posts) ? relatedRes.posts : []);
      } catch (e) {
        setError(e?.message || "Failed to load product");
        setProductData(null);
        setRelatedProductsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  useEffect(() => {
    const apiSize = productData?.attributes?.size;
    if (apiSize) {
      setSelectedSize(apiSize);
    }
  }, [productData?.attributes?.size]);

  const sizeOptions = useMemo(() => {
    const apiSize = productData?.attributes?.size;
    if (!apiSize || SIZE_OPTIONS.includes(apiSize)) {
      return SIZE_OPTIONS;
    }

    return [apiSize, ...SIZE_OPTIONS];
  }, [productData?.attributes?.size]);

  const normalizedProduct = useMemo(() => {
    const post = productData || {};
    const shop = post?.shop || {};
    const trustMeterData = shop?.trust_meter || {};
    const deliveryFeeAmount = Number(post?.attributes?.delivery_fee_amount || 0);
    const imageUrl =
      post?.cover_image_url ||
      post?.images?.[0]?.url ||
      FALLBACK_IMAGE;
    const title = post?.title || "Jeans";
    const seller = shop?.name || "Business shop";
    const city = shop?.city || "Delhi";
    const category = post?.material || post?.attributes?.color || "Cotton";
    const price = Number(post?.price ?? 1500);
    const imagesCount = Number(post?.inventory_image_count || post?.images?.length || 1);
    const trustMeter = Number(trustMeterData?.score || 0);
    const reviewCount = Number(post?.review_count || 0);

    return {
      id: String(post?.id || productId || "1"),
      title,
      category,
      location: city,
      price,
      seller,
      imageUrl,
      caption: post?.caption || "Hello caption",
      color: post?.attributes?.color || "",
      deliveryTitle: "Delivery in 2-5 days",
      deliveryMeta:
        deliveryFeeAmount > 0
          ? `Early · Delivery fee INR ${deliveryFeeAmount}`
          : "Early · Buy secure with folinko",
      trustMeter,
      reviewCount,
      platform: String(post?.social_platform || "instagram").toUpperCase(),
      shares: Number(post?.share_count || 0),
      imagesCount,
      linkLabel: "Open original",
      verificationStatus: shop?.verification_status || trustMeterData?.status || "UNVERIFIED",
      trustLabel: trustMeterData?.label || "New",
    };
  }, [productData, productId]);

  const relatedProducts = useMemo(() => {
    const currentProductId = String(productData?.id || productId || "");

    return (Array.isArray(relatedProductsData) ? relatedProductsData : [])
      .filter((post) => String(post?.id || "") !== currentProductId)
      .map((post) => ({
        id: String(post?.id || ""),
        title: post?.title || "Product",
        seller: post?.shop?.name || "Business shop",
        price: formatMoney(post?.price || 0),
        imageUrl: post?.cover_image_url || post?.images?.[0]?.url || FALLBACK_IMAGE,
      }))
      .filter((post) => post.id);
  }, [productData?.id, productId, relatedProductsData]);

  const navigateToTab = (screen) => {
    navigation.navigate("Main", { screen });
  };

  const openRelatedProduct = (nextProductId) => {
    if (!nextProductId || String(nextProductId) === String(productId)) {
      return;
    }

    navigation.replace("productDetail", { productId: nextProductId });
  };

  const handleBackToFeed = () => {
    navigation.navigate("Main", { screen: "Feed" });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.stateTitle}>Loading product...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Couldn’t load product</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.replace("productDetail", { productId })}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToFeed}>
            <FontAwesome5 name="arrow-left" size={12} color="#111827" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.mainCard}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.eyebrow}>Product</Text>
              <Text style={styles.productTitle}>{normalizedProduct.title}</Text>
              <Text style={styles.productMeta}>{normalizedProduct.category}</Text>
              <Text style={styles.productMeta}>{normalizedProduct.location}</Text>
            </View>
          </View>

          <Image source={{ uri: normalizedProduct.imageUrl }} style={styles.heroImage} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.captionText}>{normalizedProduct.caption}</Text>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{formatMoney(normalizedProduct.price)}</Text>

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>Size</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowSizeOptions((prev) => !prev)}
            >
              <Text style={styles.selectorText}>{selectedSize}</Text>
              <FontAwesome5
                name={showSizeOptions ? "chevron-up" : "chevron-down"}
                size={12}
                color="#6B7280"
              />
            </TouchableOpacity>

            {showSizeOptions && (
              <View style={styles.sizeOptions}>
                {sizeOptions.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={styles.sizeOption}
                    onPress={() => {
                      setSelectedSize(size);
                      setShowSizeOptions(false);
                    }}
                  >
                    <Text style={styles.sizeOptionText}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!!normalizedProduct.color && (
              <View style={styles.colorRow}>
                <Text style={styles.fieldLabel}>Color</Text>
                <Text style={styles.colorValue}>{normalizedProduct.color}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.primaryButton}>
                <FontAwesome5 name="shopping-bag" size={12} color="#111827" />
                <Text style={styles.primaryButtonText}>Add to cart</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.buyButton}>
                <FontAwesome5 name="bolt" size={12} color="#fff" />
                <Text style={styles.buyButtonText}>Buy now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setIsSaved((prev) => !prev)}
              >
                <FontAwesome5
                  name={isSaved ? "heart" : "heart-broken"}
                  size={12}
                  color="#111827"
                  solid={isSaved}
                />
                <Text style={styles.secondaryButtonText}>Save</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.linkButton}>
              <FontAwesome5 name="external-link-alt" size={11} color="#111827" />
              <Text style={styles.linkButtonText}>{normalizedProduct.linkLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Sold by</Text>
          <Text style={styles.infoTitle}>{normalizedProduct.seller}</Text>

          <View style={styles.trustRow}>
            <View style={styles.trustChip}>
              <FontAwesome5 name="shield-alt" size={10} color="#16A34A" />
              <Text style={styles.trustChipText}>
                {normalizedProduct.trustLabel} · {normalizedProduct.trustMeter}
              </Text>
            </View>
            <Text style={styles.infoMeta}>{normalizedProduct.verificationStatus}</Text>
          </View>

          <Text style={styles.infoMeta}>{normalizedProduct.location}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.deliveryHeaderRow}>
            <View>
              <Text style={styles.infoLabel}>Delivery</Text>
              <Text style={styles.infoTitle}>{normalizedProduct.deliveryTitle}</Text>
              <Text style={styles.infoMeta}>{normalizedProduct.deliveryMeta}</Text>
            </View>
            <View style={styles.deliveryChip}>
              <FontAwesome5 name="truck" size={11} color="#111827" />
              <Text style={styles.deliveryChipText}>Fast delivery</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Average & reviews</Text>
          <Text style={styles.reviewValue}>0.0 / 5 · {normalizedProduct.reviewCount} reviews</Text>
          <Text style={styles.stars}>☆ ☆ ☆ ☆ ☆</Text>
          <Text style={styles.infoMeta}>No reviews yet. Be the first to review.</Text>
          <Text style={styles.reviewHint}>
            Only customers who purchased this product can leave a review.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Platform</Text>
            <Text style={styles.detailValue}>{normalizedProduct.platform}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Shares</Text>
            <Text style={styles.detailValue}>{normalizedProduct.shares}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Images</Text>
            <Text style={styles.detailValue}>{normalizedProduct.imagesCount}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Related products</Text>
          {relatedProducts.length ? (
            relatedProducts.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.92}
                style={styles.relatedCard}
                onPress={() => openRelatedProduct(item.id)}
              >
                <View style={styles.relatedThumb}>
                  <Image source={{ uri: item.imageUrl }} style={styles.relatedThumbImage} />
                </View>
                <View style={styles.relatedContent}>
                  <Text style={styles.relatedTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.relatedSeller} numberOfLines={1}>{item.seller}</Text>
                  <Text style={styles.relatedPrice}>{item.price}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.infoMeta}>No related products available right now.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5EEE5",
  },
  contentContainer: {
    padding: 8,
    paddingBottom: 28,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  stateSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    marginTop: 16,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 74,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoBox: {
    width: 22,
    height: 22,
    borderRadius: 7,
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
    marginTop: 1,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    overflow: "hidden",
    marginBottom: 10,
  },
  topRow: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  eyebrow: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  productMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  heroImage: {
    width: "100%",
    height: 390,
    backgroundColor: "#E5E7EB",
  },
  quickNavRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#ECECEC",
  },
  quickNavItem: {
    alignItems: "center",
    gap: 5,
    minWidth: 58,
  },
  quickNavLabel: {
    fontSize: 10,
    color: "#111827",
  },
  sectionCard: {
    marginBottom: 10,
  },
  captionText: {
    fontSize: 12,
    color: "#374151",
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  priceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    padding: 14,
  },
  priceLabel: {
    fontSize: 10,
    color: "#6B7280",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F3F5",
    marginVertical: 12,
  },
  fieldLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
  },
  colorRow: {
    marginTop: 10,
  },
  colorValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorText: {
    fontSize: 14,
    color: "#111827",
  },
  sizeOptions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  sizeOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sizeOptionText: {
    fontSize: 14,
    color: "#111827",
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  primaryButtonText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "700",
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  buyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  secondaryButtonText: {
    color: "#111827",
    fontSize: 12,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  linkButtonText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    padding: 14,
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  infoMeta: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 4,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 2,
    flexWrap: "wrap",
  },
  trustChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#F0FDF4",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  trustChipText: {
    color: "#15803D",
    fontSize: 11,
    fontWeight: "600",
  },
  deliveryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  deliveryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  deliveryChipText: {
    fontSize: 11,
    color: "#111827",
  },
  reviewValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  stars: {
    color: "#D1D5DB",
    marginTop: 6,
    fontSize: 17,
    letterSpacing: 1,
  },
  reviewHint: {
    fontSize: 11,
    color: "#374151",
    marginTop: 10,
    lineHeight: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 7,
  },
  detailKey: {
    fontSize: 12,
    color: "#374151",
  },
  detailValue: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "700",
  },
  relatedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECE7DF",
    padding: 10,
    marginTop: 6,
  },
  relatedThumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    overflow: "hidden",
  },
  relatedThumbImage: {
    width: "100%",
    height: "100%",
  },
  relatedThumbText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  relatedContent: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  relatedSeller: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 3,
  },
  relatedPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
    marginTop: 4,
  },
});
