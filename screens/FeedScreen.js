import React, { useEffect, useState } from "react";
import {
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
import { customerAuth, feed, markets, shops } from "../services/api";

export default function FeedScreen() {
  const navigation = useNavigation();
  const [stores, setStores] = useState([]);
  const [marketsData, setMarketsData] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [marketsRes, shopsData, feeds] = await Promise.all([
        markets.list(),
        shops.discover(),
        feed.getFeed(),
      ]);

      console.log('feeds==========', JSON.stringify(feeds));
      const nextStores = Array.isArray(shopsData?.shops) ? shopsData.shops : [];
      const nextMarkets = Array.isArray(marketsRes?.markets) ? marketsRes.markets : [];
      
      setStores(nextStores);
      setMarketsData(nextMarkets);
    } catch (e) {
      console.error("Failed to load feed data:", e);
      setStores([]);
      setMarketsData([]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header
          title="Feed"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
        />
        {/* Header */}
        <HeaderSearch />

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
        <DiscoveryCard />
        {stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
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