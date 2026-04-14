import React, { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ResizeMode, Video } from "expo-av";
import * as Location from "expo-location";
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
const FEATURED_REEL_URL = "https://folinko.com/uploads/feed/fashion.mp4";
const MAX_RECENTLY_VIEWED = 6;
const MAX_RECENT_SEARCH_TERMS = 6;
const MAX_VISIBLE_MARKET_CITIES = 4;
const DEFAULT_RECENT_SEARCH_TERMS = ["saree", "jeans"];

const formatMoney = (amount) => {
  const numericAmount = Number(amount || 0);
  return `INR ${numericAmount}`;
};

const formatCityLabel = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
    .join(" ");

const getCityKey = (value) => formatCityLabel(value).toLowerCase();

const normalizeRecentlyViewedItem = (post) => ({
  id: String(post?.id || ""),
  title: post?.title || "Item",
  price: formatMoney(post?.price),
  image: post?.cover_image_url || post?.images?.[0]?.url || FALLBACK_PRODUCT_IMAGE,
});

const normalizeInfluencersResponse = (response) => {
  if (!response || response?.error || response?.errors || response?.success === false) {
    return [];
  }

  const candidateLists = [
    response?.influencers,
    response?.data?.influencers,
    response?.data?.results,
    response?.data,
    response?.results,
    response?.items,
  ];

  for (const list of candidateLists) {
    if (Array.isArray(list)) {
      return list;
    }
  }

  return [];
};

export default function FeedScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [stores, setStores] = useState([]);
  const [marketsData, setMarketsData] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [displayedStores, setDisplayedStores] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [activeDiscoveryFilters, setActiveDiscoveryFilters] = useState({});
  const [showAllMarketplaceCities, setShowAllMarketplaceCities] = useState(false);
  const [recentSearchTerms, setRecentSearchTerms] = useState(DEFAULT_RECENT_SEARCH_TERMS);
  const [recentlyViewedItems, setRecentlyViewedItems] = useState([]);
  const [activeStoreQuery, setActiveStoreQuery] = useState("");
  const [loadingStores, setLoadingStores] = useState(true);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [storesError, setStoresError] = useState("");
  const [detectingCity, setDetectingCity] = useState(false);
  const [cityDetectionError, setCityDetectionError] = useState("");
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

  const loadDisplayedStores = useCallback(
    async ({ city = selectedCity, q = activeStoreQuery, filters = activeDiscoveryFilters, showLoading = true } = {}) => {
      const normalizedCity = formatCityLabel(city);
      const normalizedQuery = String(q || "").trim();

      if (showLoading) {
        setLoadingStores(true);
      }

      setStoresError("");

      try {
        const shopsData = await shops.discover({
          ...(filters || {}),
          ...(normalizedCity ? { city: normalizedCity } : {}),
          ...(normalizedQuery ? { q: normalizedQuery } : {}),
        });

        setDisplayedStores(Array.isArray(shopsData?.shops) ? shopsData.shops : []);
      } catch (e) {
        setDisplayedStores([]);
        setStoresError(e?.message || "Failed to load discovery stores");
      } finally {
        if (showLoading) {
          setLoadingStores(false);
        }
      }
    },
    [activeDiscoveryFilters, activeStoreQuery, selectedCity]
  );

  const fetchData = async () => {
    try {
      setStoresError("");
      setLoadingStores(true);
      const [marketsRes, shopsData, influencersRes] = await Promise.all([
        markets.list(),
        shops.discover(),
        shops.discover({ account_type: "influencer", verified: true, page: 1, page_size: 20 }).catch(() => null),
      ]);
      console.log('shopsData===========', shopsData);

      const nextStores = Array.isArray(shopsData?.shops) ? shopsData.shops : [];
      const nextMarkets = Array.isArray(marketsRes?.markets) ? marketsRes.markets : [];
      const nextInfluencers = Array.isArray(influencersRes?.shops)
        ? influencersRes.shops
        : normalizeInfluencersResponse(influencersRes);
      setStores(nextStores);
      setDisplayedStores(nextStores);
      setMarketsData(nextMarkets);
      setInfluencers(nextInfluencers);
    } catch (e) {
      console.error("Failed to load feed data:", e);
      setStoresError(e?.message || "Failed to load discovery stores");
      setStores([]);
      setDisplayedStores([]);
      setMarketsData([]);
      setInfluencers([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const marketplaceCities = useMemo(() => {
    const nextCities = new Map();

    (marketsData.length ? marketsData : FALLBACK_TOP_MARKETS).forEach((market, index) => {
      const cityLabel = formatCityLabel(market?.city || market?.name || market?.market_name);

      if (!cityLabel) {
        return;
      }

      const cityKey = getCityKey(cityLabel);

      if (!nextCities.has(cityKey)) {
        nextCities.set(cityKey, {
          id: String(market?.id || cityKey || index),
          city: cityLabel,
          shopCount: Number(market?.post_count || 0),
        });
      }
    });

    if (selectedCity) {
      const selectedCityKey = getCityKey(selectedCity);

      if (selectedCityKey && !nextCities.has(selectedCityKey)) {
        nextCities.set(selectedCityKey, {
          id: selectedCityKey,
          city: formatCityLabel(selectedCity),
          shopCount: 0,
        });
      }
    }

    return Array.from(nextCities.values());
  }, [marketsData, selectedCity]);

  const visibleMarketplaceCities = useMemo(() => {
    if (showAllMarketplaceCities || marketplaceCities.length <= MAX_VISIBLE_MARKET_CITIES) {
      return marketplaceCities;
    }

    const defaultVisibleCities = marketplaceCities.slice(0, MAX_VISIBLE_MARKET_CITIES);
    const selectedCityKey = getCityKey(selectedCity);
    const hasVisibleSelectedCity = defaultVisibleCities.some((item) => getCityKey(item.city) === selectedCityKey);

    if (!selectedCityKey || hasVisibleSelectedCity) {
      return defaultVisibleCities;
    }

    const selectedCityItem = marketplaceCities.find((item) => getCityKey(item.city) === selectedCityKey);

    if (!selectedCityItem) {
      return defaultVisibleCities;
    }

    return [...defaultVisibleCities.slice(0, MAX_VISIBLE_MARKET_CITIES - 1), selectedCityItem];
  }, [marketplaceCities, selectedCity, showAllMarketplaceCities]);

  const hasMoreMarketplaceCities = marketplaceCities.length > MAX_VISIBLE_MARKET_CITIES;

  useEffect(() => {
    loadRecentlyViewedItems();
  }, [loadRecentlyViewedItems]);

  useEffect(() => {
    loadRecentSearchTerms();
  }, [loadRecentSearchTerms]);

  const handleApplyDiscoveryFilters = async (params) => {
    const nextFilters = params || {};

    try {
      setApplyingFilters(true);
      setActiveStoreQuery("");
      setActiveDiscoveryFilters(nextFilters);
      await loadDisplayedStores({ city: selectedCity, q: "", filters: nextFilters });
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

      setActiveStoreQuery(normalizedTerm);
      await saveRecentSearchTerm(normalizedTerm);
      await loadDisplayedStores({ city: selectedCity, q: normalizedTerm, filters: activeDiscoveryFilters });
    },
    [activeDiscoveryFilters, loadDisplayedStores, saveRecentSearchTerm, selectedCity]
  );

  const handleSelectCity = useCallback(
    async (city) => {
      const nextCity = formatCityLabel(city);
      setSelectedCity(nextCity);
      setCityDetectionError("");
      await loadDisplayedStores({ city: nextCity, q: activeStoreQuery, filters: activeDiscoveryFilters });
    },
    [activeDiscoveryFilters, activeStoreQuery, loadDisplayedStores]
  );

  const handleClearCityFilter = useCallback(async () => {
    setSelectedCity("");
    setCityDetectionError("");
    await loadDisplayedStores({ city: "", q: activeStoreQuery, filters: activeDiscoveryFilters });
  }, [activeDiscoveryFilters, activeStoreQuery, loadDisplayedStores]);

  const handleAutoDetectCity = useCallback(async () => {
    try {
      setDetectingCity(true);
      setCityDetectionError("");

      const permissionResponse = await Location.requestForegroundPermissionsAsync();

      if (permissionResponse.status !== "granted") {
        throw new Error("Location permission is required to auto detect your city.");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const address = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const detectedCity = formatCityLabel(
        address?.[0]?.city || address?.[0]?.subregion || address?.[0]?.district || address?.[0]?.region
      );

      if (!detectedCity) {
        throw new Error("Could not detect your city.");
      }

      setSelectedCity(detectedCity);
      await loadDisplayedStores({ city: detectedCity, q: activeStoreQuery, filters: activeDiscoveryFilters });
    } catch (e) {
      setCityDetectionError(e?.message || "Failed to auto detect your city.");
    } finally {
      setDetectingCity(false);
    }
  }, [activeDiscoveryFilters, activeStoreQuery, loadDisplayedStores]);

  const topMarkets = (marketsData.length ? marketsData : FALLBACK_TOP_MARKETS).slice(0, 6);

  const trendingInfluencers = useMemo(() => {
    const normalizedInfluencers = Array.isArray(influencers) ? influencers : [];

    const normalizedFromApi = normalizedInfluencers
      .filter((item) => item)
      .map((item, index) => {
        const store = item?.shop || item?.store || item?.business || item?.seller || item;
        const slug = String(
          store?.slug ||
            store?.username ||
            store?.handle ||
            item?.slug ||
            item?.username ||
            item?.handle ||
            ""
        );
        const name =
          store?.name ||
          store?.full_name ||
          store?.fullName ||
          item?.name ||
          item?.full_name ||
          item?.fullName ||
          "Creator";
        const city = formatCityLabel(store?.city || item?.city);
        const isVerified =
          store?.verified ??
          store?.is_verified ??
          store?.verification_status === "VERIFIED" ??
          item?.verified ??
          item?.is_verified ??
          item?.verification_status === "VERIFIED";
        const listings = Number(
          store?.post_count ??
            store?.listings_count ??
            store?.products_count ??
            item?.post_count ??
            item?.listings_count ??
            item?.products_count ??
            0
        );
        const imageUrl =
          store?.cover_image_url ||
          store?.coverImage ||
          store?.avatar_url ||
          store?.profile_image_url ||
          item?.cover_image_url ||
          item?.avatar_url ||
          item?.profile_image_url ||
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80";

        return {
          id: String(store?.id || item?.id || slug || index),
          store,
          name,
          handle: slug ? `@${slug}` : "@creator",
          city: city || "",
          isVerified: Boolean(isVerified),
          listings: Number.isFinite(listings) ? Math.max(0, Math.trunc(listings)) : 0,
          imageUrl,
        };
      });

    if (normalizedFromApi.length) {
      return normalizedFromApi;
    }

    const normalizedStores = Array.isArray(stores) ? stores : [];

    return [...normalizedStores]
      .filter((store) => store?.id)
      .sort((a, b) => {
        const aVerified = (a?.verified ?? a?.verification_status === "VERIFIED") ? 1 : 0;
        const bVerified = (b?.verified ?? b?.verification_status === "VERIFIED") ? 1 : 0;

        if (aVerified !== bVerified) {
          return bVerified - aVerified;
        }

        const aPosts = Number(a?.post_count || 0);
        const bPosts = Number(b?.post_count || 0);

        if (aPosts !== bPosts) {
          return bPosts - aPosts;
        }

        const aName = String(a?.name || "");
        const bName = String(b?.name || "");
        return aName.localeCompare(bName);
      })
      .slice(0, 10)
      .map((store) => {
        const isVerified = store?.verified ?? store?.verification_status === "VERIFIED";
        const slug = String(store?.slug || "");
        const cityLabel = formatCityLabel(store?.city);
        const postCount = Number(store?.post_count || 0);

        return {
          id: String(store?.id),
          store,
          name: store?.name || "Creator",
          handle: slug ? `@${slug}` : "@creator",
          city: cityLabel || "",
          isVerified: Boolean(isVerified),
          listings: Number.isFinite(postCount) ? postCount : 0,
          imageUrl:
            store?.cover_image_url ||
            store?.coverImage ||
            "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
        };
      });
  }, [influencers, stores]);

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
        <View style={styles.marketplaceCard}>
          <View style={styles.marketplaceHeaderRow}>
            <View style={styles.marketplaceTitleWrap}>
              <Text style={styles.marketplaceEyebrow}>Marketplace</Text>
              <Text style={styles.marketplaceTitle}>Folinko</Text>
            </View>

            <View style={styles.marketplaceActionRow}>
              <TouchableOpacity
                style={styles.marketplaceActionButton}
                onPress={handleAutoDetectCity}
                disabled={detectingCity}
              >
                <FontAwesome5 name="crosshairs" size={18} color="#1F2937" />
                <Text style={styles.marketplaceActionText}>{detectingCity ? "Detecting..." : "Auto detect"}</Text>
              </TouchableOpacity>

              {/* <TouchableOpacity style={styles.marketplaceActionButton} onPress={handleClearCityFilter}>
                <FontAwesome5 name="map-marker-alt" size={18} color="#1F2937" />
                <Text style={styles.marketplaceActionText}>{selectedCity || "All cities"}</Text>
              </TouchableOpacity> */}
            </View>
          </View>

          {!!cityDetectionError ? <Text style={styles.marketplaceErrorText}>{cityDetectionError}</Text> : null}

          <View style={styles.marketplaceChipWrap}>
            <TouchableOpacity
              style={[styles.marketplaceChip, !selectedCity && styles.marketplaceChipActive]}
              onPress={handleClearCityFilter}
            >
              <Text style={[styles.marketplaceChipTitle, !selectedCity && styles.marketplaceChipTitleActive]}>All</Text>
            </TouchableOpacity>

            {visibleMarketplaceCities.map((market) => {
              const isSelected = getCityKey(selectedCity) === getCityKey(market.city);

              return (
                <TouchableOpacity
                  key={market.id}
                  style={[styles.marketplaceChip, isSelected && styles.marketplaceChipActive]}
                  onPress={() => handleSelectCity(market.city)}
                >
                  <Text style={[styles.marketplaceChipTitle, isSelected && styles.marketplaceChipTitleActive]}>
                    {market.city}
                  </Text>
                  <Text style={[styles.marketplaceChipCount, isSelected && styles.marketplaceChipCountActive]}>{` ${market.shopCount} ${market.shopCount === 1 ? "shop" : "shops"}`}</Text>
                </TouchableOpacity>
              );
            })}

            {hasMoreMarketplaceCities ? (
              <TouchableOpacity
                style={styles.marketplaceMoreChip}
                onPress={() => setShowAllMarketplaceCities((value) => !value)}
              >
                <Text style={styles.marketplaceMoreChipText}>{showAllMarketplaceCities ? "Less" : "More"}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
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

        <View style={styles.reelCard}>
          <Video
            source={{ uri: FEATURED_REEL_URL }}
            style={styles.reelVideo}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
        </View>

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

        <Text style={styles.sectionTitle}>Trending influencers</Text>
        <Text style={styles.influencerSubtitle}>Explore influencers near you. Tap to open their storefront.</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.influencerScrollContent}
        >
          {trendingInfluencers.map((creator) => (
            <TouchableOpacity
              key={creator.id}
              activeOpacity={0.92}
              style={styles.influencerCard}
              onPress={() =>
                navigation.navigate("storeDetail", {
                  shopSlug: creator.store?.slug,
                  store: creator.store,
                  accountType: "influencer",
                })
              }
            >
              <Image source={{ uri: creator.imageUrl }} style={styles.influencerImage} />

              <View style={styles.influencerInfoPanel}>
                <View style={styles.influencerNameRow}>
                  <Text style={styles.influencerName} numberOfLines={1}>
                    {creator.name}
                  </Text>

                  {creator.isVerified ? (
                    <View style={styles.influencerVerifiedPill}>
                      <FontAwesome5 name="check-circle" size={12} color="#047857" />
                      <Text style={styles.influencerVerifiedText}>Verified</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.influencerMeta} numberOfLines={1}>
                  {creator.city ? `${creator.handle} · ${creator.city}` : creator.handle}
                </Text>
                <Text style={styles.influencerListings}>{`${creator.listings} listing${creator.listings === 1 ? "" : "s"}`}</Text>
              </View>
            </TouchableOpacity>
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
  marketplaceCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 34,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  marketplaceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  marketplaceTitleWrap: {
    marginRight: 12,
    marginBottom: 12,
  },
  marketplaceEyebrow: {
    fontSize: 14,
    color: "#667085",
    fontWeight: "500",
  },
  marketplaceTitle: {
    marginTop: 6,
    fontSize: 16,
    lineHeight: 28,
    fontWeight: "700",
    color: "#101828",
  },
  marketplaceActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    flex: 1,
  },
  marketplaceActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginLeft: 10,
    marginBottom: 10,
  },
  marketplaceActionText: {
    marginLeft: 10,
    fontSize: 12,
    fontWeight: "500",
    color: "#1F2937",
  },
  marketplaceErrorText: {
    marginBottom: 10,
    fontSize: 12,
    color: "#B42318",
  },
  marketplaceChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  marketplaceChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginRight: 12,
    marginBottom: 12,
  },
  marketplaceChipActive: {
    borderColor: "#F3B998",
    borderWidth: 3,
  },
  marketplaceChipTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#101828",
  },
  marketplaceChipTitleActive: {
    color: "#101828",
  },
  marketplaceChipCount: {
    fontSize: 12,
    color: "#667085",
    fontWeight: "500",
  },
  marketplaceChipCountActive: {
    color: "#667085",
  },
  marketplaceMoreChip: {
    backgroundColor: "#F8F4EA",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D8DEE8",
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginRight: 12,
    marginBottom: 12,
  },
  marketplaceMoreChipText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#344054",
  },
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

  reelCard: {
    marginHorizontal: 28,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    backgroundColor: "#000000",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    width: '60%',
    alignSelf: "center",
    justifyContent: "center",
    flex: 1,
    display: 'flex'

  },
  reelVideo: {
    width: "100%",
    aspectRatio: 9 / 16,
    maxHeight: 400,
    backgroundColor: "#000000",
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
    paddingVertical: 12,
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
    fontSize: 12,
    fontWeight: "700",
    color: "#101828",
  },
  topMarketsCount: {
    fontSize: 12,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  recentSearchChipActive: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  recentSearchChipText: {
    fontSize: 12,
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

  influencerSectionHeader: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  influencerEyebrow: {
    fontSize: 14,
    fontWeight: "500",
    color: "#667085",
  },
  influencerTitle: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    color: "#101828",
  },
  influencerSubtitle: {
    marginTop: -4,
    paddingHorizontal: 16,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "#475467",
  },
  influencerScrollContent: {
    paddingLeft: 16,
    paddingRight: 10,
    paddingTop: 14,
    paddingBottom: 10,
  },
  influencerCard: {
    width: 250,
    marginRight: 14,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8DEE8",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  influencerImage: {
    width: "100%",
    height: 240,
    backgroundColor: "#E5E7EB",
  },
  influencerInfoPanel: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  influencerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  influencerName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#101828",
  },
  influencerVerifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ECFDF3",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  influencerVerifiedText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#047857",
  },
  influencerMeta: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    color: "#475467",
  },
  influencerListings: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "700",
    color: "#101828",
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