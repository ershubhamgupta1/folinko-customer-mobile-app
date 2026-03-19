import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from '../components/Header';
import { analytics } from "../services/api";
import { useNavigation } from "@react-navigation/native";

export default function AnalyticsScreen() {

  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [overview, setOverview] = useState(null);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      const [summaryRes, overviewRes] = await Promise.all([
        analytics.getSummary(),
        analytics.getOverview(),
      ]);

      console.log('summary=========', JSON.stringify(summaryRes, null, 2));
      console.log('overview=========', JSON.stringify(overviewRes, null, 2));

      setSummary(summaryRes || null);
      setOverview(overviewRes || null);
    } catch (e) {
      console.error('Error fetching analytics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const shopName = summary?.shop?.name || overview?.shop?.name || "—";
  const kpis = overview?.kpis || {};
  const inventory = overview?.inventory || {};
  const engagement = overview?.engagement || {};
  const topPosts = overview?.tables?.top_posts || [];
  const recentPosts = overview?.tables?.recent_posts || [];
  const metrics = summary?.metrics || {};

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  };

  const Metric = ({ title, value, desc }) => (
    <View style={styles.metric}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDesc}>{desc}</Text>
    </View>
  )

  const Row = ({ title, subtitle, right }) => (
    <View style={styles.rowItem}>
      <View>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>

      <Text style={styles.rowRight}>{right}</Text>
    </View>
  )

  if (loading && !summary && !overview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Header
          title="Analytics"
          onNotificationPress={() => console.log("Notification pressed")}
          onProfilePress={() => navigation.navigate("userProfile")}
        />
        <View style={{ padding: 20 }}>
          {/* Shop Analytics */}
          <View style={styles.card}>

            <Text style={styles.smallTitle}>Shop Analytics</Text>
            <Text style={styles.title}>{shopName}</Text>

            <Text style={styles.description}>
              Sales, customers, payouts, and growth signals — shop-scoped and built for decision-making.
            </Text>

            <Metric title="Gross Sales" value={`₹${kpis.gross_sales ?? 0}`} desc="GMV (before platform fee)" />
            <Metric title="Platform Fee" value={`₹${kpis.platform_fee ?? 0}`} desc="10% marketplace fee" />
            <Metric title="Net Sales" value={`₹${kpis.net_sales ?? 0}`} desc="GMV after fee" />
            <Metric title="Orders" value={`${kpis.orders ?? 0}`} desc="Track conversion and AOV" />
            <Metric title="Payouts Pending" value={`₹${kpis.payouts_pending ?? 0}`} desc="Settlement pipeline" />

          </View>
          {/* Inventory Growth */}
          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <Text style={styles.smallTitle}>Inventory Growth</Text>
              <Text style={styles.smallTitle}>{inventory.total_posts ?? metrics.total_posts ?? 0} posts</Text>
            </View>

            <Text style={styles.titleSmall}>Posts (last 14 days)</Text>

            <View style={styles.chart}></View>

          </View>
          {/* Engagement */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.smallTitle}>Engagement</Text>
              <Text style={styles.smallTitle}>{engagement.shares_7d ?? 0} in 7d · {engagement.shares_30d ?? 0} in 30d</Text>
            </View>
            <Text style={styles.titleSmall}>Shares (last 14 days)</Text>
            <View style={styles.chart}></View>
          </View>


          {/* Top Posts */}

          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <Text style={styles.smallTitle}>Top Posts</Text>
              <Feather name="trending-up" size={18} />
            </View>

            <Text style={styles.titleSmall}>Best performing by shares</Text>

            {topPosts.length === 0 ? (
              <Row title="No posts yet" subtitle="" right="" />
            ) : (
              topPosts.slice(0, 5).map((p) => (
                <Row
                  key={p.id}
                  title={p.title || `Post #${p.id}`}
                  subtitle={`${(p.social_platform || "").toString()} · ${formatDate(p.created_at)}`}
                  right={`${p.share_count ?? 0}`}
                />
              ))
            )}

          </View>


          {/* Recent Activity */}

          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <Text style={styles.smallTitle}>Recent Activity</Text>
              <Feather name="clock" size={18} />
            </View>

            <Text style={styles.titleSmall}>Latest posts created</Text>

            {recentPosts.length === 0 ? (
              <Row title="No recent activity" subtitle="" right="" />
            ) : (
              recentPosts.slice(0, 5).map((p) => (
                <Row
                  key={p.id}
                  title={p.title || `Post #${p.id}`}
                  subtitle={`${(p.social_platform || "").toString()} · ${formatDate(p.created_at)}`}
                  right={`${p.currency || "INR"} ${p.price ?? 0}`}
                />
              ))
            )}

          </View>
          {/* Catalog Snapshot */}

          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <Text style={styles.smallTitle}>Inventory Intelligence</Text>
              <Feather name="maximize-2" size={18} />
            </View>

            <Text style={styles.titleSmall}>Catalog snapshot</Text>

            <Metric title="Total Posts" value={`${inventory.total_posts ?? 0}`} desc="" />
            <Metric
              title="Priced Posts"
              value={`${inventory.priced_posts ?? 0}`}
              desc={`${inventory.min_price ?? 0} min · ${inventory.max_price ?? 0} max`}
            />
            <Metric title="Catalog Value" value={`${inventory.catalog_value ?? 0}`} desc="Sum of all priced posts" />

          </View>
          {/* Social Signal */}

          <View style={styles.card}>

            <View style={styles.rowBetween}>
              <Text style={styles.smallTitle}>Engagement</Text>
              <Feather name="share-2" size={18} />
            </View>

            <Text style={styles.titleSmall}>Social signal</Text>

            <View style={styles.metricRow}>

              <View style={styles.metricHalf}>
                <Text style={styles.metricTitle}>Total Shares</Text>
                <Text style={styles.metricValue}>{metrics.total_shares ?? engagement.total_shares ?? 0}</Text>
              </View>

              <View style={styles.metricHalf}>
                <Text style={styles.metricTitle}>Images</Text>
                <Text style={styles.metricValue}>{metrics.total_images ?? inventory.total_images ?? 0}</Text>
              </View>

            </View>

            <View style={styles.recommendCard}>
              <Text style={styles.metricTitle}>Recommendation</Text>
              <Text style={styles.metricDesc}>
                Your highest leverage metric right now is shares. Make every post “shareable”: clear price, 3 images, short title, and a strong caption.
              </Text>
            </View>

          </View>


          <Text style={styles.footer}>
            © 2026 Social Commerce SaaS · Business Console
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>

  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },

  card: {
    backgroundColor: "#f4f4f4",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827"
  },

  titleSmall: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 12
  },

  description: {
    fontSize: 14,
    color: "#4b5563",
    marginVertical: 12
  },

  metric: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  metricTitle: {
    fontSize: 14,
    color: "#6b7280"
  },

  metricValue: {
    fontSize: 22,
    fontWeight: "700"
  },

  metricDesc: {
    fontSize: 12,
    color: "#6b7280"
  },

  chart: {
    height: 120,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb"
  },

  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eee"
  },

  rowTitle: {
    fontWeight: "600"
  },

  rowSub: {
    fontSize: 12,
    color: "#6b7280"
  },

  rowRight: {
    fontWeight: "600"
  },

  metricRow: {
    flexDirection: "row",
    gap: 10
  },

  metricHalf: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16
  },

  recommendCard: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16
  },

  footer: {
    textAlign: "center",
    color: "#9ca3af",
    marginBottom: 40
  },

  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6
  },

  qrText: {
    marginLeft: 6
  }

});