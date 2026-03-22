import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { markets, posts, shops } from "../services/api";

export default function FeedScreen() {
  const navigation = useNavigation();
  const [stores, setStores] = useState([]);
  const [marketsData, setMarketsData] = useState([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [storesError, setStoresError] = useState("");
  const [lookupUrl, setLookupUrl] = useState("");
  const [lookingUpPost, setLookingUpPost] = useState(false);
  const [lookupError, setLookupError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

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
      setMarketsData(nextMarkets);
    } catch (e) {
      console.error("Failed to load feed data:", e);
      setStoresError(e?.message || "Failed to load discovery stores");
      setStores([]);
      setMarketsData([]);
    } finally {
      setLoadingStores(false);
    }
  };

  const handleApplyDiscoveryFilters = async (params) => {
    try {
      setApplyingFilters(true);
      setStoresError("");
      const shopsData = await shops.discover(params || {});
      setStores(Array.isArray(shopsData?.shops) ? shopsData.shops : []);
    } catch (e) {
      console.error("Failed to apply discovery filters:", e);
      setStores([]);
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

      navigation.navigate("productDetail", { productId: postId });
    } catch (e) {
      setLookupError("No product found for this post URL.");
    } finally {
      setLookingUpPost(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Header
          title="Feed"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
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

        {/* Trending */}
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

        {!loadingStores && !storesError && stores.length === 0 ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>No shops found for the selected filters.</Text>
          </View>
        ) : null}

        {!loadingStores && !storesError && stores.map((store) => (
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