import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { shops } from "../services/api";


const getArray = (value) => (Array.isArray(value) ? value : []);

export default function StoreDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // const shopSlug = route.params?.shopSlug || initialStore?.slug;
  const shopSlug = 'sharma-sarees';

  const [shopData, setShopData] = useState({});
  const [shopPosts, setShopPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShop = async () => {
      if (shopSlug) {
        setError("Store not found");
        setShopData({});
        setShopPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await shops.getBySlug(shopSlug);
        const nextShop =
          response?.shop ||
          response?.data?.shop ||
          response?.profile ||
          response?.store ||
          null;
        const nextPostsCandidates = [
          response?.posts,
          response?.items,
          response?.results,
          response?.shop?.posts,
        ];
        const nextPosts =
          nextPostsCandidates.find((candidate) => Array.isArray(candidate) && candidate.length >= 0) || [];

        setShopData(nextShop);
        setShopPosts(nextPosts);
      } catch (e) {
        setError(e?.message || "Failed to load store");
        setShopData({});
        setShopPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [shopSlug]);

  const normalizedStore = useMemo(() => {
    const shop = shopData || {};
    const trustMeter = shop?.trust_meter || {};
    const verificationStatus = String(
      shop?.verification_status || trustMeter?.status || "UNVERIFIED"
    ).toUpperCase();
    const trustScore = Number(trustMeter?.score || 0);
    const overview =
      shop?.description ||
      shop?.bio ||
      `${shop?.name || "This store"} is a trusted local seller from ${shop?.city || "your city"}. They share curated products and marketplace updates on Folinko.`;

    return {
      id: String(shop?.id || ""),
      slug: shop?.slug || shopSlug || "",
      name: shop?.name || "Store",
      city: shop?.city || "Delhi",
      category: shop?.category || "Fashion",
      coverImage: shop?.cover_image_url || FALLBACK_STORE_IMAGE,
      postCount: Number(shop?.post_count || shopPosts.length || 0),
      trustScore,
      trustLabel: trustMeter?.label || "New",
      verificationStatus,
      verified: verificationStatus === "VERIFIED",
      currency: shop?.currency || "INR",
      promoted: Boolean(shop?.is_promoted),
      overview,
    };
  }, [initialStore, shopData, shopPosts.length, shopSlug]);

  const normalizedPosts = useMemo(() => {
    return getArray(shopPosts).map((item, index) => ({
      id: String(item?.id || index),
      title: item?.title || `Post ${index + 1}`,
      price: Number(item?.price || 0),
      currency: item?.currency || normalizedStore.currency,
      imageUrl: item?.cover_image_url || item?.images?.[0]?.url || FALLBACK_POST_IMAGE,
      platform: String(item?.social_platform || "instagram").toLowerCase(),
      socialUrl: item?.social_url || normalizedStore?.social_url,
      shareCount: Number(item?.share_count || 0),
    }));
  }, [normalizedStore.currency, normalizedStore?.social_url, shopPosts]);

  const socialLinks = useMemo(() => {
    const shop = shopData || initialStore || {};
    return SOCIAL_META.map((item) => ({
      ...item,
      url:
        shop?.social_links?.[item.key] ||
        shop?.[`${item.key}_url`] ||
        (item.key === "instagram" ? shop?.social_url : ""),
    }));
  }, [initialStore, shopData]);

  const navigateToTab = (screen) => {
    navigation.navigate("Main", { screen });
  };

  const handleOpenUrl = async (url) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch (e) {
      console.error("Failed to open url", e);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.stateTitle}>Loading store...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !shopData) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Couldn’t load store</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.replace("storeDetail", { shopSlug, store: initialStore })}
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

        <View style={styles.heroCard}>
          <Image source={{ uri: normalizedStore.coverImage }} style={styles.heroBackground} />
          <View style={styles.heroOverlay} />

          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroEyebrow}>Store</Text>
              <Text style={styles.heroTitle}>{normalizedStore.name}</Text>
              <Text style={styles.heroMeta}>{normalizedStore.city} · {normalizedStore.category}</Text>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <FontAwesome5 name="arrow-left" size={11} color="#111827" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.heroInfoCard}>
            <View style={styles.badgeRow}>
              <View style={styles.infoBadge}>
                <FontAwesome5 name="th-large" size={10} color="#EF6C00" />
                <Text style={styles.infoBadgeText}>{normalizedStore.postCount} posts</Text>
              </View>
              <View style={styles.infoBadge}>
                <FontAwesome5 name="check-circle" size={10} color="#16A34A" />
                <Text style={styles.infoBadgeText}>{normalizedStore.verificationStatus}</Text>
              </View>
              <View style={styles.infoBadge}>
                <FontAwesome5 name="shield-alt" size={10} color="#2563EB" />
                <Text style={styles.infoBadgeText}>Trust {normalizedStore.trustScore}</Text>
              </View>
            </View>

            <View style={styles.socialRow}>
              {socialLinks.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.socialChip, !item.url && styles.socialChipMuted]}
                  onPress={() => handleOpenUrl(item.url)}
                  disabled={!item.url}
                >
                  <FontAwesome5 name={item.icon} size={10} color="#111827" />
                  <Text style={styles.socialChipText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.aboutLabel}>About store</Text>
            <Text style={styles.aboutText}>{normalizedStore.overview}</Text>

            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.outlineAction}>
                <FontAwesome5 name="comment" size={11} color="#111827" />
                <Text style={styles.outlineActionText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineAction}>
                <FontAwesome5 name="share-alt" size={11} color="#111827" />
                <Text style={styles.outlineActionText}>Follow link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navItem} onPress={() => navigateToTab("Feed")}>
            <FontAwesome5 name="play" size={13} color="#111827" />
            <Text style={styles.navLabel}>Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigateToTab("Wishlist")}>
            <FontAwesome5 name="heart" size={13} color="#111827" />
            <Text style={styles.navLabel}>Wishlist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigateToTab("cart")}>
            <FontAwesome5 name="shopping-bag" size={13} color="#111827" />
            <Text style={styles.navLabel}>Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => navigateToTab("Orders")}>
            <FontAwesome5 name="receipt" size={13} color="#111827" />
            <Text style={styles.navLabel}>Orders</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.inlineErrorCard}>
            <Text style={styles.inlineErrorText}>{error}</Text>
          </View>
        ) : null}

        {normalizedPosts.map((item) => (
          <View key={item.id} style={styles.postCard}>
            <View style={styles.postHeaderRow}>
              <View style={styles.platformChip}>
                <FontAwesome5
                  name={item.platform === "facebook" ? "facebook-f" : item.platform === "youtube" ? "youtube" : "instagram"}
                  size={10}
                  color="#111827"
                />
                <Text style={styles.platformChipText}>
                  {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)}
                </Text>
              </View>
            </View>

            <Image source={{ uri: item.imageUrl }} style={styles.postImage} />

            <View style={styles.postFooter}>
              <Text style={styles.postTitle}>{item.title}</Text>
              <Text style={styles.postSubMeta}>₹ {item.price}</Text>
              <Text style={styles.postShareText}>↪ {item.shareCount}</Text>

              <View style={styles.postActionRow}>
                <TouchableOpacity
                  style={styles.lightButton}
                  onPress={() => navigation.navigate("productDetail", { productId: item.id })}
                >
                  <Text style={styles.lightButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.lightButton}>
                  <Text style={styles.lightButtonText}>Add</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.openLinkButton}
                onPress={() => handleOpenUrl(item.socialUrl)}
                disabled={!item.socialUrl}
              >
                <Text style={styles.openLinkButtonText}>Open original</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {normalizedPosts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.stateTitle}>No posts yet</Text>
            <Text style={styles.stateSubtitle}>This store hasn’t published any visible posts yet.</Text>
          </View>
        ) : null}
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
    lineHeight: 18,
    textAlign: "center",
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
  loginButton: {
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
  loginText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7DFD5",
  },
  heroBackground: {
    width: "100%",
    height: 170,
    position: "absolute",
    top: 0,
    left: 0,
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor: "rgba(255,255,255,0.72)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
    zIndex: 1,
  },
  heroEyebrow: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  heroMeta: {
    marginTop: 4,
    fontSize: 11,
    color: "#374151",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 6,
  },
  backText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  heroInfoCard: {
    marginTop: 80,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 12,
    borderWidth: 1,
    borderColor: "#EFE8DE",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#FFF7ED",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  infoBadgeText: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "600",
  },
  socialRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  socialChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  socialChipMuted: {
    opacity: 0.55,
  },
  socialChipText: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "500",
  },
  aboutLabel: {
    marginTop: 12,
    fontSize: 11,
    color: "#6B7280",
  },
  aboutText: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "#374151",
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  outlineAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  outlineActionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    paddingVertical: 10,
    marginBottom: 10,
  },
  navItem: {
    alignItems: "center",
    gap: 5,
    minWidth: 58,
  },
  navLabel: {
    fontSize: 10,
    color: "#111827",
  },
  inlineErrorCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  inlineErrorText: {
    color: "#991B1B",
    fontSize: 12,
  },
  postCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    marginBottom: 10,
    overflow: "hidden",
  },
  postHeaderRow: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  platformChipText: {
    fontSize: 10,
    color: "#111827",
    fontWeight: "500",
  },
  postImage: {
    width: "100%",
    height: 330,
    backgroundColor: "#E5E7EB",
  },
  postFooter: {
    padding: 12,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  postSubMeta: {
    fontSize: 12,
    color: "#111827",
    marginTop: 4,
    fontWeight: "700",
  },
  postShareText: {
    marginTop: 4,
    fontSize: 10,
    color: "#6B7280",
  },
  postActionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  lightButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  lightButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111827",
  },
  openLinkButton: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  openLinkButtonText: {
    fontSize: 11,
    color: "#6B7280",
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7DFD5",
    padding: 18,
  },
});
