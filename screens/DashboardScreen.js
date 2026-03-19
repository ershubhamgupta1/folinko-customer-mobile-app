import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import Header from "../components/Header";
import { analytics } from "../services/api";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const StatCard = ({ title, desc, value }) => (
  <View style={styles.statBox}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value || "—"}</Text>
    <Text style={styles.statDesc}>{desc}</Text>
  </View>
);

const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [metrics, setMetrics] = useState({});
  const [shop, setShop] = useState({});

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      const summaryResponse = await analytics.getSummary();
      console.log('summaryResponse========', JSON.stringify(summaryResponse))
      
      // Extract data from API response
      const metricsData = summaryResponse?.metrics || {};
      const shopData = summaryResponse?.shop || {};
      
      // Set state variables
      setMetrics(metricsData);
      setShop(shopData);
      
      console.log('Metrics:', metricsData);
      console.log('Shop:', shopData);
      
    } catch (error) {
      console.error("Error fetching summary data:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSummaryData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Header
          title="Dashboard"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
        />

        <View style={styles.content}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('feedScreen')}>
          <Text style={styles.buttonText}>Open Feed</Text>
          <Feather name="arrow-right" size={16} color="#1f2937" />
        </TouchableOpacity>

          {/* Quick Actions */}
          <View style={styles.card}>
            <Text style={styles.smallTitle}>Quick Actions</Text>

            <Text style={styles.title}>
              Run your storefront like a product
            </Text>

            <Text style={styles.description}>
              Upload social links, add structured product details, and build trust
              with verification. This is how we kill "DM for price".
            </Text>

            <View style={styles.statsContainer}>
              <StatCard
                title="Total Posts"
                desc="Every post is a structured product card"
                value={metrics.total_posts}
              />
              <StatCard
                title="Inventory Images"
                desc="Boost conversions with multi-image support"
                value={metrics.total_images}
              />
              <StatCard
                title="Total Shares"
                desc="Signal: demand and social proof"
                value={metrics.total_shares}
              />
            </View>
          </View>

          {/* QR Identity */}
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.smallTitle}>Unified Shop Identity</Text>
                <Text style={styles.title}>One QR. One link.</Text>
              </View>

              <MaterialIcons name="qr-code" size={24} color="#667085" />
            </View>

            <Text style={styles.description}>
              Use a single QR to bridge offline traffic to your video-first storefront.
            </Text>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Manage</Text>
              <Feather name="arrow-right" size={16} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {/* Trust Verification */}
          <View style={styles.card}>
            <View style={styles.header}>
              <View>
                <Text style={styles.smallTitle}>Trust & Verification</Text>
                <Text style={styles.title}>Earn the Blue Tick</Text>
              </View>

              <Feather name="check-circle" size={22} color="#5f6b7a" />
            </View>

            <Text style={styles.description}>
              Submit GST, shop photos, and social proof. Verification unlocks marketplace trust.
            </Text>

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('trustMeter')}>
              <Text style={styles.buttonText}>Open Trust Meter</Text>
              <Feather name="arrow-right" size={16} color="#1f2937" />
            </TouchableOpacity>
          </View>

          {/* Account */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account</Text>
            <Text style={styles.value}>—</Text>

            <View style={styles.innerCard}>
              <Text style={styles.innerTitle}>Shop status</Text>

              <Text style={styles.description}>
                Create your shop to unlock metrics.
              </Text>

              <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Create shop</Text>
                <Feather name="arrow-right" size={16} color="#1f2937" />
              </TouchableOpacity>
            </View>
          </View>
            {/* <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('shopProfile')}>
              <Text style={styles.buttonText}>View shop identity</Text>
            </TouchableOpacity> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
safeArea: {
  flex: 1,
  backgroundColor: "#fff",
},
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    padding: 20,
  },

  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e3e3e3",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },

  description: {
    fontSize: 13,
    color: "#4b5563",
    marginVertical: 8,
    lineHeight: 20,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f8f8f8",
  },

  buttonText: {
    fontSize: 13,
    marginRight: 6,
    color: "#1f2937",
    fontWeight: "500",
  },

  statsContainer: {
    gap: 12,
    marginTop: 10,
  },

  statBox: {
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 16,
  },

  statTitle: {
    fontSize: 13,
    color: "#475569",
  },

  statValue: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 4,
    color: "#111827",
  },

  statDesc: {
    fontSize: 12,
    color: "#64748b",
  },

  sectionTitle: {
    fontSize: 15,
    color: "#475569",
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#111827",
  },

  innerCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 18,
  },

  innerTitle: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 6,
  },
});

export default DashboardScreen;