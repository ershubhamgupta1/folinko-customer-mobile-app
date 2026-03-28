import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  Image,
  TouchableOpacity,
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HeaderSearch from "../components/HeaderSearch";
import StoreCard from "../components/StoreCard";
import DiscoveryCard from "../components/DiscoveryCard";
import Header from "../components/Header";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { markets, posts, shops } from "../services/api";

const FALLBACK_TOP_MARKETS = [
  { id: "market-1", city: "Noida", post_count: 4 },
  { id: "market-2", city: "Mohali", post_count: 2 },
  { id: "market-3", city: "Delhi", post_count: 1 },
];

const RECENTLY_VIEWED_STORAGE_KEY = "@recently_viewed_post_ids";
const RECENT_SEARCH_TERMS_STORAGE_KEY = "@recent_search_terms";
const FALLBACK_PRODUCT_IMAGE = "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=900&q=80";
const MAX_RECENTLY_VIEWED = 6;
const MAX_RECENT_SEARCH_TERMS = 6;
const DEFAULT_RECENT_SEARCH_TERMS = ["saree", "jeans"];

const formatMoney = (amount) => {
  const numericAmount = Number(amount || 0);
  return `INR ${numericAmount}`;
};

const normalizeRecentlyViewedItem = (post) => ({
  id: String(post?.id || ""),
  title: post?.title || "Item",
  price: formatMoney(post?.price),
  image: post?.cover_image_url || post?.images?.[0]?.url || FALLBACK_PRODUCT_IMAGE,
});

export default function FeedScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [stores, setStores] = useState([]);
  const [marketsData, setMarketsData] = useState([]);
  const [displayedStores, setDisplayedStores] = useState([]);
  const [recentSearchTerms, setRecentSearchTerms] = useState(DEFAULT_RECENT_SEARCH_TERMS);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState([]);
  const [activeStoreQuery, setActiveStoreQuery] = useState("");
  const [loadingStores, setLoadingStores] = useState(true);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [storesError, setStoresError] = useState("");
  const [lookupUrl, setLookupUrl] = useState("");
  const [lookingUpPost, setLookingUpPost] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const loadRecentlyViewedItems = useCallback(async () => {
    try {
      const storedValue = await AsyncStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
      const parsedIds = JSON.parse(storedValue || "[]");
      const recentIds = Array.isArray(parsedIds)
        ? parsedIds.map((item) => String(item || "").trim()).filter(Boolean).slice(0, MAX_RECENTLY_VIEWED)
        : [];

      if (!recentIds.length) {
        setRecentlyViewedItems([]);
        return;
      }

      const responses = await Promise.all(
        recentIds.map((postId) => posts.getById(postId).catch(() => null))
      );

      const nextItems = responses
        .map((response) => response?.post || response)
        .filter((post) => post?.id)
        .map(normalizeRecentlyViewedItem);

      setRecentlyViewedItems(nextItems);
    } catch (e) {
      setRecentlyViewedItems([]);
    }
  }, []);

  const loadRecentSearchTerms = useCallback(async () => {
    try {
      const storedValue = await AsyncStorage.getItem(RECENT_SEARCH_TERMS_STORAGE_KEY);
      const parsedTerms = JSON.parse(storedValue || "[]");
      const nextTerms = Array.isArray(parsedTerms)
        ? parsedTerms.map((item) => String(item || "").trim()).filter(Boolean).slice(0, MAX_RECENT_SEARCH_TERMS)
        : [];

      setRecentSearchTerms(nextTerms.length ? nextTerms : DEFAULT_RECENT_SEARCH_TERMS);
    } catch (e) {
      setRecentSearchTerms(DEFAULT_RECENT_SEARCH_TERMS);
    }
  }, []);

  const saveRecentlyViewedPostId = useCallback(
    async (postId) => {
      const normalizedPostId = String(postId || "").trim();

      if (!normalizedPostId) {
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
        const parsedIds = JSON.parse(storedValue || "[]");
        const currentIds = Array.isArray(parsedIds)
          ? parsedIds.map((item) => String(item || "").trim()).filter(Boolean)
          : [];
        const nextIds = [normalizedPostId, ...currentIds.filter((item) => item !== normalizedPostId)].slice(
          0,
          MAX_RECENTLY_VIEWED
        );

        await AsyncStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(nextIds));
        await loadRecentlyViewedItems();
      } catch (e) {
        console.error("Failed to save recently viewed item:", e);
      }
    },
    [loadRecentlyViewedItems]
  );

  const saveRecentSearchTerm = useCallback(
    async (term) => {
      const normalizedTerm = String(term || "").trim().toLowerCase();

      if (!normalizedTerm) {
        return;
      }

      try {
        const storedValue = await AsyncStorage.getItem(RECENT_SEARCH_TERMS_STORAGE_KEY);
        const parsedTerms = JSON.parse(storedValue || "[]");
        const currentTerms = Array.isArray(parsedTerms)
          ? parsedTerms.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean)
          : DEFAULT_RECENT_SEARCH_TERMS;
        const nextTerms = [normalizedTerm, ...currentTerms.filter((item) => item !== normalizedTerm)].slice(
          0,
          MAX_RECENT_SEARCH_TERMS
        );

        await AsyncStorage.setItem(RECENT_SEARCH_TERMS_STORAGE_KEY, JSON.stringify(nextTerms));
        setRecentSearchTerms(nextTerms);
      } catch (e) {
        console.error("Failed to save recent search term:", e);
      }
    },
    []
  );

  const fetchData = async () => {
    try {
      setStoresError("");
      setLoadingStores(true);
      const [marketsRes, shopsData] = await Promise.all([
        markets.list(),
        shops.discover(),
      ]);

      const nextStores = Array.isArray(shopsData?.shops) ? shopsData.shops : [];
      const nextMarkets = Array.isArray(marketsRes?.markets) ? marketsRes.markets : [];
      setStores(nextStores);
      setDisplayedStores(nextStores);
      setMarketsData(nextMarkets);
    } catch (e) {
      console.error("Failed to load feed data:", e);
      setStoresError(e?.message || "Failed to load discovery stores");
      setStores([]);
      setDisplayedStores([]);
      setMarketsData([]);
    } finally {
      setLoadingStores(false);
    }
  };

  useEffect(() => {
    loadRecentlyViewedItems();
  }, [loadRecentlyViewedItems]);

  useEffect(() => {
    loadRecentSearchTerms();
  }, [loadRecentSearchTerms]);

  const handleApplyDiscoveryFilters = async (params) => {
    try {
      setApplyingFilters(true);
      setStoresError("");
      setActiveStoreQuery("");
      const shopsData = await shops.discover(params || {});
      setDisplayedStores(Array.isArray(shopsData?.shops) ? shopsData.shops : []);
    } catch (e) {
      console.error("Failed to apply discovery filters:", e);
      setDisplayedStores([]);
      setStoresError(e?.message || "Failed to apply discovery filters");
    } finally {
      setApplyingFilters(false);
    }
  };

  const handleLookupPost = async () => {
    const normalizedUrl = String(lookupUrl || "").trim();

    if (!normalizedUrl) {
      setLookupError("Paste a social post link to search.");
      return;
    }

    try {
      setLookingUpPost(true);
      setLookupError("");

      const response = await posts.lookupByUrl(normalizedUrl);
      const postId =
        response?.post_id ??
        response?.postId ??
        response?.id ??
        response?.post?.id;

      if (!postId) {
        setLookupError("No product found for this post URL.");
        return;
      }

      await saveRecentlyViewedPostId(postId);
      navigation.navigate("productDetail", { productId: postId });
    } catch (e) {
      setLookupError("No product found for this post URL.");
    } finally {
      setLookingUpPost(false);
    }
  };

  const handleRecentSearchPress = useCallback(
    async (term) => {
      const normalizedTerm = String(term || "").trim();

      if (!normalizedTerm) {
        return;
      }

      try {
        setLoadingStores(true);
        setStoresError("");
        setActiveStoreQuery(normalizedTerm);
        await saveRecentSearchTerm(normalizedTerm);

        const shopsData = await shops.discover({ q: normalizedTerm });
        setDisplayedStores(Array.isArray(shopsData?.shops) ? shopsData.shops : []);
      } catch (e) {
        setDisplayedStores([]);
        setStoresError(e?.message || `Failed to load stores for ${normalizedTerm}.`);
      } finally {
        setLoadingStores(false);
      }
    },
    [saveRecentSearchTerm]
  );

  const topMarkets = (marketsData.length ? marketsData : FALLBACK_TOP_MARKETS).slice(0, 6);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Header
          title="Feed"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
          showIcons={isAuthenticated}
          rightComponent={!isAuthenticated ? (
            <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
              <FontAwesome5 name="sign-in-alt" size={14} color="#111827" />
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          ) : null}
        />
        {/* Header */}
        <HeaderSearch
          value={lookupUrl}
          onChangeText={(value) => {
            setLookupUrl(value);
            if (lookupError) {
              setLookupError("");
            }
          }}
          onSearch={handleLookupPost}
          loading={lookingUpPost}
          errorMessage={lookupError}
        />

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Stores right now</Text>
            <Text style={styles.statNumber}>{stores.length}</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Active markets</Text>
            <Text style={styles.statNumber}>{marketsData.length}</Text>
          </View>
        </View>

        <View style={styles.topMarketsCard}>
          <Text style={styles.topMarketsTitle}>Top markets</Text>

          {topMarkets.map((market, index) => {
            const marketName = market?.city || `Market ${index + 1}`;
            const dropCount = Number(market?.post_count || 0);

            return (
              <View key={String(market?.id || marketName || index)} style={styles.topMarketsRow}>
                <View style={styles.topMarketsLeft}>
                  <FontAwesome5 name="map-marker-alt" size={18} color="#475467" />
                  <Text style={styles.topMarketsName}>{marketName}</Text>
                </View>

                <Text style={styles.topMarketsCount}>{`${dropCount} ${dropCount === 1 ? "drop" : "drops"}`}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.recentSearchCard}>
          <Text style={styles.recentSearchTitle}>Recently searched</Text>

          <View style={styles.recentSearchChipWrap}>
            {recentSearchTerms.map((term) => {
              const isActive = activeStoreQuery.toLowerCase() === String(term).toLowerCase();

              return (
                <TouchableOpacity
                  key={term}
                  style={[styles.recentSearchChip, isActive && styles.recentSearchChipActive]}
                  onPress={() => handleRecentSearchPress(term)}
                  disabled={loadingStores && isActive}
                >
                  <Text style={[styles.recentSearchChipText, isActive && styles.recentSearchChipTextActive]}>{term}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.recentlyViewedCard}>
          <View style={styles.recentlyViewedHeader}>
            <Text style={styles.recentlyViewedTitle}>Recently viewed</Text>
            <TouchableOpacity onPress={loadRecentlyViewedItems}>
              <Text style={styles.recentlyViewedRefresh}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {recentlyViewedItems.length === 0 ? (
            <View style={styles.recentEmptyState}>
              <Text style={styles.recentEmptyStateText}>Search for a post to build your recently viewed list.</Text>
            </View>
          ) : (
            recentlyViewedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.recentlyViewedRow}
                onPress={() => navigation.navigate("productDetail", { productId: item.id })}
              >
                <Image source={{ uri: item.image }} style={styles.recentlyViewedImage} />

                <View style={styles.recentlyViewedContent}>
                  <Text style={styles.recentlyViewedName}>{item.title}</Text>
                  <Text style={styles.recentlyViewedPrice}>{item.price}</Text>
                </View>

                <FontAwesome5 name="chevron-right" size={18} color="#98A2B3" />
              </TouchableOpacity>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Trending stores</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} horizontal />
          ))}
        </ScrollView>

        {/* Feed List */}
        <DiscoveryCard onApply={handleApplyDiscoveryFilters} applying={applyingFilters} />

        {loadingStores ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="small" color="#111827" />
            <Text style={styles.stateText}>Loading discovery stores...</Text>
          </View>
        ) : null}

        {!loadingStores && !!storesError ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{storesError}</Text>
          </View>
        ) : null}

        {!loadingStores && !storesError && displayedStores.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>No shops found for the selected filters.</Text>
          </View>
        ) : null}

        {!loadingStores && !storesError && displayedStores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}

        <View style={styles.confidenceCard}>
          <Text style={styles.confidenceTitle}>Buyer confidence</Text>

          <View style={styles.confidenceItem}>
            <View style={styles.confidenceIconWrap}>
              <FontAwesome5 name="check-circle" size={18} color="#475467" />
            </View>
            <Text style={styles.confidenceText}>Verified sellers are highlighted on listings.</Text>
          </View>

          <View style={styles.confidenceItem}>
            <View style={styles.confidenceIconWrap}>
              <FontAwesome5 name="money-check-alt" size={18} color="#475467" />
            </View>
            <Text style={styles.confidenceText}>Orders and tracking are visible in your account.</Text>
          </View>

          <View style={styles.confidenceItem}>
            <View style={styles.confidenceIconWrap}>
              <FontAwesome5 name="shield-alt" size={18} color="#475467" />
            </View>
            <Text style={styles.confidenceText}>Pricing stays transparent from cart to checkout.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F7F7" },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  loginButtonText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  statBox: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderRadius: 24,
    width: "48%",
    borderWidth: 1,
    borderColor: "#D8DEE8",
  },
  statNumber: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "700",
    color: "#101828",
    marginTop: 10,
  },
  statLabel: {
    color: "#475467",
    fontSize: 14,
    fontWeight: "500",
  },

  topMarketsCard: {
    backgroundColor: "#F8F4EA",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  topMarketsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#475467",
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  topMarketsRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topMarketsLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  topMarketsName: {
    marginLeft: 14,
    fontSize: 14,
    fontWeight: "700",
    color: "#101828",
  },
  topMarketsCount: {
    fontSize: 14,
    fontWeight: "500",
    color: "#667085",
  },

  recentSearchCard: {
    backgroundColor: "#F8F4EA",
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  recentSearchTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#475467",
    marginBottom: 14,
  },
  recentSearchChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  recentSearchChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginRight: 12,
    marginBottom: 8,
  },
  recentSearchChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  recentSearchChipText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },
  recentSearchChipTextActive: {
    color: "#FFFFFF",
  },

  recentlyViewedCard: {
    backgroundColor: "#F8F4EA",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  recentlyViewedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  recentlyViewedTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#475467",
  },
  recentlyViewedRefresh: {
    fontSize: 16,
    fontWeight: "500",
    color: "#667085",
  },
  recentEmptyState: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginTop: 10,
  },
  recentEmptyStateText: {
    fontSize: 13,
    color: "#667085",
    textAlign: "center",
  },
  recentlyViewedRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  recentlyViewedImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  recentlyViewedContent: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
  },
  recentlyViewedName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#101828",
  },
  recentlyViewedPrice: {
    marginTop: 6,
    fontSize: 14,
    color: "#475467",
    fontWeight: "500",
  },

  stateCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: {
    marginTop: 8,
    color: "#475467",
    fontSize: 14,
    textAlign: "center",
  },

  confidenceCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#D9E0EA",
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  confidenceTitle: {
    fontSize: 14,
    color: "#667085",
    marginBottom: 10,
  },
  confidenceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
  },
  confidenceIconWrap: {
    width: 26,
    alignItems: "center",
    marginRight: 8,
    paddingTop: 2,
  },
  confidenceText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 22,
    color: "#344054",
    fontWeight: "500",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginVertical: 10,
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
  },
  filter: {
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  applyBtn: {
    backgroundColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  marketDropdownContainer: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
  },
  dropdownMenu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginTop: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
  },
});