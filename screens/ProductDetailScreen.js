import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { cart, posts, reviews, wishlist } from "../services/api";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80";

const RECENTLY_VIEWED_STORAGE_KEY = "@recently_viewed_post_ids";
const MAX_RECENTLY_VIEWED = 6;

const SIZE_OPTIONS = ["M", "L", "XL", "XXL"];

const normalizeSizeValue = (value) => String(value || "").trim().toUpperCase();
const normalizeColorValue = (value) => String(value || "").trim();
const formatColorLabel = (value) =>
  normalizeColorValue(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
    .join(" ");

const normalizeExternalUrl = (value) => {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  return `https://${normalizedValue.replace(/^\/+/, "")}`;
};

const extractSizeOptions = (post) => {
  const nextSizes = [];

  const appendSize = (value) => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(appendSize);
      return;
    }

    if (typeof value === "object") {
      appendSize(value?.size || value?.label || value?.name || value?.value);
      return;
    }

    String(value)
      .split(/[,/|]/)
      .map((item) => normalizeSizeValue(item))
      .filter(Boolean)
      .forEach((item) => {
        if (!nextSizes.includes(item)) {
          nextSizes.push(item);
        }
      });
  };

  appendSize(post?.attributes?.sizes);
  appendSize(post?.sizes);
  appendSize(post?.attributes?.size);
  appendSize(post?.size);
  appendSize(post?.variants);
  appendSize(post?.attributes?.variants);

  return nextSizes.length ? nextSizes : SIZE_OPTIONS;
};

const extractColorOptions = (post) => {
  const nextColors = [];

  const appendColor = (value) => {
    if (!value) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(appendColor);
      return;
    }

    if (typeof value === "object") {
      appendColor(value?.color || value?.label || value?.name || value?.value);
      return;
    }

    String(value)
      .split(/[,/|]/)
      .map((item) => formatColorLabel(item))
      .filter(Boolean)
      .forEach((item) => {
        if (!nextColors.includes(item)) {
          nextColors.push(item);
        }
      });
  };

  appendColor(post?.attributes?.colors);
  appendColor(post?.colors);
  appendColor(post?.attributes?.color);
  appendColor(post?.color);
  appendColor(post?.variants);
  appendColor(post?.attributes?.variants);

  return nextColors;
};

const getReviewRating = (review) => {
  const rating = Number(review?.rating ?? review?.score ?? review?.stars ?? review?.star_rating ?? 0);

  if (!Number.isFinite(rating)) {
    return 0;
  }

  return Math.max(0, Math.min(5, rating));
};

const normalizeReviewItem = (review, index) => ({
  id: String(review?.id || review?.review_id || `review-${index}`),
  title: review?.title || review?.headline || review?.subject || review?.product_title || "Review",
  body: review?.body || review?.comment || review?.review || review?.text || review?.message || "",
  rating: getReviewRating(review),
  isMine: Boolean(review?.is_mine || review?.mine || review?.owned_by_me || review?.my_review),
});

const extractReviewItems = (response) => {
  const source = Array.isArray(response)
    ? response
    : Array.isArray(response?.reviews)
      ? response.reviews
      : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data)
          ? response.data
          : [];

  return source.map((item, index) => normalizeReviewItem(item, index)).filter((item) => item.id);
};

const buildReviewSummary = (response, items) => {
  const apiAverage = Number(response?.average_rating ?? response?.avg_rating ?? response?.rating_average ?? response?.average);
  const derivedAverage = items.length
    ? items.reduce((sum, item) => sum + item.rating, 0) / items.length
    : 0;
  const average = Number.isFinite(apiAverage) && apiAverage > 0 ? apiAverage : derivedAverage;
  const apiCount = Number(response?.review_count ?? response?.count ?? response?.total);
  const count = Number.isFinite(apiCount) && apiCount > 0 ? apiCount : items.length;
  const hasReviewed = Boolean(
    response?.has_reviewed ||
      response?.already_reviewed ||
      response?.my_review ||
      items.some((item) => item.isMine)
  );

  return {
    average,
    count,
    hasReviewed,
  };
};

const formatMoney = (amount) => {
  const numericAmount = Number(amount || 0);
  return `INR ${numericAmount}`;
};

export default function ProductDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { logout, isAuthenticated } = useAuth();
  const productId = route.params?.productId ?? route.params?.id;
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [showColorOptions, setShowColorOptions] = useState(false);
  const [postReviews, setPostReviews] = useState([]);
  const [reviewsSummary, setReviewsSummary] = useState({ average: 0, count: 0, hasReviewed: false });
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [relatedProductsData, setRelatedProductsData] = useState([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [cartFeedback, setCartFeedback] = useState({ type: "", message: "" });
  const [savingToWishlist, setSavingToWishlist] = useState(false);
  const [wishlistFeedback, setWishlistFeedback] = useState({ type: "", message: "" });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        console.log('response=========>>>>', JSON.stringify(response))
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
    const saveRecentlyViewedProductId = async () => {
      const normalizedProductId = String(productData?.id || productId || "").trim();

      if (!normalizedProductId) {
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
        const parsedIds = JSON.parse(storedValue || "[]");
        const currentIds = Array.isArray(parsedIds)
          ? parsedIds.map((item) => String(item || "").trim()).filter(Boolean)
          : [];
        const nextIds = [normalizedProductId, ...currentIds.filter((item) => item !== normalizedProductId)].slice(
          0,
          MAX_RECENTLY_VIEWED
        );

        await AsyncStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextIds));
      } catch (e) {
        console.error("Failed to save recently viewed item:", e);
      }
    };

    saveRecentlyViewedProductId();
  }, [productData?.id, productId]);

  const sizeOptions = useMemo(() => {
    return extractSizeOptions(productData);
  }, [productData]);

  const colorOptions = useMemo(() => {
    return extractColorOptions(productData);
  }, [productData]);

  useEffect(() => {
    if (!sizeOptions.length) {
      setSelectedSize("");
      return;
    }

    setSelectedSize((currentValue) => {
      if (sizeOptions.includes(normalizeSizeValue(currentValue))) {
        return normalizeSizeValue(currentValue);
      }

      return "";
    });
  }, [sizeOptions]);

  useEffect(() => {
    if (!colorOptions.length) {
      setSelectedColor("");
      setShowColorOptions(false);
      return;
    }

    setSelectedColor((currentValue) => {
      if (colorOptions.includes(formatColorLabel(currentValue))) {
        return formatColorLabel(currentValue);
      }

      return "";
    });
  }, [colorOptions]);

  useEffect(() => {
    const fetchPostReviews = async () => {
      if (!productId) {
        setPostReviews([]);
        setReviewsSummary({ average: 0, count: 0, hasReviewed: false });
        setReviewsError("");
        return;
      }

      try {
        setLoadingReviews(true);
        setReviewsError("");

        const response = await reviews.listForPost(productId);
        const nextReviews = extractReviewItems(response);

        setPostReviews(nextReviews);
        setReviewsSummary(buildReviewSummary(response, nextReviews));
      } catch (e) {
        setPostReviews([]);
        setReviewsSummary({ average: 0, count: 0, hasReviewed: false });
        setReviewsError(e?.message || "Failed to load reviews.");
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchPostReviews();
  }, [productId]);

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

    const allImages = [
      post?.cover_image_url,
      ...(post?.images?.map(img => img?.url) || [])
    ].filter(Boolean);

    return {
      id: String(post?.id || productId),
      title,
      category,
      location: city,
      price,
      seller,
      imageUrl,
      allImages: allImages.length > 0 ? allImages : [imageUrl], // Ensure at least one image
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
      socialUrl: normalizeExternalUrl(post?.social_url || post?.attributes?.social_url || shop?.social_url || ""),
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

  const handleOpenOriginal = async () => {
    try {
      const targetUrl = normalizedProduct.socialUrl;

      if (!targetUrl) {
        Alert.alert("Link unavailable", "Original post link is not available for this product.");
        return;
      }

      const canOpen = await Linking.canOpenURL(targetUrl);

      if (!canOpen) {
        Alert.alert("Invalid link", "Could not open the original post link.");
        return;
      }

      await Linking.openURL(targetUrl);
    } catch (e) {
      Alert.alert("Unable to open link", "Could not open the original post link.");
    }
  };

  const handleAddToCart = async () => {
    const targetPostId = productData?.id || productId;

    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    if (!targetPostId) {
      setCartFeedback({ type: "error", message: "Product not available for cart." });
      return;
    }

    try {
      setAddingToCart(true);
      setCartFeedback({ type: "", message: "" });

      const response = await cart.add(targetPostId, { quantity: 1 });

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to add product to cart.");
      }

      setCartFeedback({ type: "success", message: "Added to cart." });
    } catch (e) {
      setCartFeedback({ type: "error", message: e?.message || "Failed to add product to cart." });
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const targetPostId = productData?.id || productId;

    if (!targetPostId) {
      setCartFeedback({ type: "error", message: "Product not available for checkout." });
      return;
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }

    if (!selectedSize) {
      setCartFeedback({ type: "error", message: "Please select size before buying now." });
      return;
    }

    if (colorOptions.length && !selectedColor) {
      setCartFeedback({ type: "error", message: "Please select color before buying now." });
      return;
    }

    try {
      setBuyingNow(true);
      setCartFeedback({ type: "", message: "" });

      const response = await cart.add(targetPostId, { quantity: 1 });

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to continue to checkout.");
      }

      navigation.navigate("checkoutScreen");
    } catch (e) {
      setCartFeedback({ type: "error", message: e?.message || "Failed to continue to checkout." });
    } finally {
      setBuyingNow(false);
    }
  };

  const handleSaveToWishlist = async () => {
    const targetPostId = productData?.id || productId;

    if (!targetPostId) {
      setWishlistFeedback({ type: "error", message: "Product not available for wishlist." });
      return;
    }

    try {
      setSavingToWishlist(true);
      setWishlistFeedback({ type: "", message: "" });

      const response = await wishlist.add(targetPostId);

      if (response === undefined || response?.error || response?.errors || response?.success === false) {
        throw new Error(response?.message || "Failed to save product.");
      }

      setIsSaved(true);
      setWishlistFeedback({ type: "success", message: "Saved to wishlist." });
    } catch (e) {
      setWishlistFeedback({ type: "error", message: e?.message || "Failed to save product." });
    } finally {
      setSavingToWishlist(false);
    }
  };

  const handleBackToFeed = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("feedScreen");
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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 28 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToFeed}>
            <FontAwesome5 name="arrow-left" size={12} color="#111827" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{normalizedProduct.title}</Text>
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

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            style={styles.heroImageScrollView}
            onMomentumScrollEnd={(event) => {
              const contentOffset = event.nativeEvent.contentOffset;
              const index = Math.round(contentOffset.x / Dimensions.get('window').width);
              setCurrentImageIndex(index);
            }}
          >
            {normalizedProduct.allImages.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={styles.heroImage}
              />
            ))}
          </ScrollView>

          {/* Pagination dots */}
          {normalizedProduct.allImages.length > 1 && (
            <View style={styles.paginationDots}>
              {normalizedProduct.allImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentImageIndex ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.captionText}>{normalizedProduct.caption}</Text>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Price</Text>
            <Text style={styles.priceValue}>{formatMoney(normalizedProduct.price)}</Text>

            <View style={styles.divider} />

            <Text style={styles.fieldLabel}>Size</Text>
            <View style={styles.sizeChipWrap}>
              {sizeOptions.map((size) => {
                const isSelected = selectedSize === size;

                return (
                  <TouchableOpacity
                    key={size}
                    style={[styles.sizeChip, isSelected && styles.sizeChipActive]}
                    onPress={() => {
                      setSelectedSize(size);
                      if (cartFeedback.message) {
                        setCartFeedback({ type: "", message: "" });
                      }
                    }}
                  >
                    <Text style={[styles.sizeChipText, isSelected && styles.sizeChipTextActive]}>{size}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!colorOptions.length && (
              <View style={styles.colorRow}>
                <Text style={styles.fieldLabel}>Color</Text>

                <TouchableOpacity
                  style={styles.colorSelector}
                  onPress={() => setShowColorOptions((prev) => !prev)}
                >
                  <Text style={[styles.colorSelectorText, !selectedColor && styles.colorSelectorPlaceholderText]}>
                    {selectedColor || "Select color"}
                  </Text>
                  <FontAwesome5
                    name={showColorOptions ? "chevron-up" : "chevron-down"}
                    size={12}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {showColorOptions ? (
                  <View style={styles.colorOptions}>
                    {colorOptions.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={styles.colorOption}
                        onPress={() => {
                          setSelectedColor(color);
                          setShowColorOptions(false);
                          if (cartFeedback.message) {
                            setCartFeedback({ type: "", message: "" });
                          }
                        }}
                      >
                        <Text style={styles.colorOptionText}>{color}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.primaryButton, addingToCart && styles.buttonDisabled]}
                onPress={handleAddToCart}
                disabled={addingToCart}
              >
                <FontAwesome5 name="shopping-bag" size={12} color="#111827" />
                <Text style={styles.primaryButtonText}>{addingToCart ? "Adding..." : "Add to cart"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.buyButton, buyingNow && styles.buttonDisabled]}
                onPress={handleBuyNow}
                disabled={buyingNow}
              >
                <FontAwesome5 name="bolt" size={12} color="#fff" />
                <Text style={styles.buyButtonText}>{buyingNow ? "Redirecting..." : "Buy now"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, savingToWishlist && styles.buttonDisabled]}
                onPress={handleSaveToWishlist}
                disabled={savingToWishlist}
              >
                <FontAwesome5
                  name={isSaved ? "heart" : "heart-broken"}
                  size={12}
                  color="#111827"
                  solid={isSaved}
                />
                <Text style={styles.secondaryButtonText}>{savingToWishlist ? "Saving..." : "Save"}</Text>
              </TouchableOpacity>
            </View>

            {!!cartFeedback.message && (
              <Text
                style={[
                  styles.actionFeedbackText,
                  cartFeedback.type === "error" && styles.actionFeedbackErrorText,
                ]}
              >
                {cartFeedback.message}
              </Text>
            )}

            {!!wishlistFeedback.message && (
              <Text
                style={[
                  styles.actionFeedbackText,
                  wishlistFeedback.type === "error" && styles.actionFeedbackErrorText,
                ]}
              >
                {wishlistFeedback.message}
              </Text>
            )}

            <TouchableOpacity style={styles.linkButton} onPress={handleOpenOriginal}>
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

        <View style={styles.reviewSectionCard}>
          <Text style={styles.reviewSectionTitle}>Ratings & reviews</Text>
          <Text style={styles.reviewSummaryText}>{`${reviewsSummary.average.toFixed(1)} / 5 · ${reviewsSummary.count} review${reviewsSummary.count === 1 ? "" : "s"}`}</Text>

          <View style={styles.reviewStarsRow}>
            {Array.from({ length: 5 }).map((_, index) => (
              <FontAwesome5
                key={`summary-star-${index}`}
                name="star"
                solid
                size={18}
                color={index < Math.round(reviewsSummary.average) ? "#FDB022" : "#E4E7EC"}
                style={styles.reviewStarIcon}
              />
            ))}
          </View>

          {loadingReviews ? <Text style={styles.reviewHint}>Loading reviews...</Text> : null}

          {!loadingReviews && postReviews.map((review) => (
            <View key={review.id} style={styles.reviewItemCard}>
              <View style={styles.reviewItemHeader}>
                <Text style={styles.reviewItemTitle} numberOfLines={1}>{review.title}</Text>

                <View style={styles.reviewItemStars}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <FontAwesome5
                      key={`${review.id}-star-${index}`}
                      name="star"
                      solid
                      size={14}
                      color={index < Math.round(review.rating) ? "#FDB022" : "#E4E7EC"}
                      style={styles.reviewItemStarIcon}
                    />
                  ))}
                </View>
              </View>

              {!!review.body ? <Text style={styles.reviewItemBody}>{review.body}</Text> : null}
            </View>
          ))}

          {!loadingReviews && !postReviews.length && !reviewsError ? (
            <Text style={styles.reviewHint}>No reviews yet. Be the first to review.</Text>
          ) : null}

          {!!reviewsError ? <Text style={[styles.reviewHint, styles.actionFeedbackErrorText]}>{reviewsError}</Text> : null}

          <Text style={styles.reviewHint}>
            {reviewsSummary.hasReviewed
              ? "You have already reviewed this product."
              : "Only customers who purchased this product can leave a review."}
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
  heroImageScrollView: {
    width: "100%",
    height: 390,
  },
  heroImage: {
    width: Dimensions.get('window').width,
    height: 390,
    backgroundColor: "#E5E7EB",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: "#111827",
  },
  inactiveDot: {
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderWidth: 1,
    borderColor: "#111827",
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
  sizeChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
    marginBottom: 4,
  },
  sizeChip: {
    width: 36,
    height: 36,
    borderRadius: 37,
    borderWidth: 1,
    borderColor: "#D9DEE6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    // marginBottom: 14,
  },
  sizeChipActive: {
    borderColor: "#111827",
    backgroundColor: "#F8FAFC",
  },
  sizeChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  sizeChipTextActive: {
    color: "#111827",
  },
  colorRow: {
    marginTop: 6,
  },
  colorSelector: {
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
  colorSelectorText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
  },
  colorSelectorPlaceholderText: {
    color: "#6B7280",
    fontWeight: "500",
  },
  colorOptions: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  colorOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  colorOptionText: {
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
  buttonDisabled: {
    opacity: 0.7,
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
  actionFeedbackText: {
    marginTop: 10,
    fontSize: 12,
    color: "#166534",
    fontWeight: "600",
  },
  actionFeedbackErrorText: {
    color: "#B42318",
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
  reviewSectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#D9DEE6",
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 10,
  },
  reviewSectionTitle: {
    fontSize: 12,
    color: "#475467",
    fontWeight: "500",
  },
  reviewSummaryText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  reviewStarsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  reviewStarIcon: {
    marginRight: 10,
  },
  reviewItemCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#D9DEE6",
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  reviewItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  reviewItemTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  reviewItemStars: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewItemStarIcon: {
    marginLeft: 6,
  },
  reviewItemBody: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: "#475467",
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
