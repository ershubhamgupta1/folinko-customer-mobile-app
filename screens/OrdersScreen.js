import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { feed, orders } from '../services/api';
import Header from '../components/Header';
import { SafeAreaView } from "react-native-safe-area-context";

const OrdersScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      if (!refreshing) setLoading(true);

      const response = await orders?.getOrders();
      let ordersDataRes = response?.orders || [];

      // fallback mock
      if (ordersDataRes.length === 0) {
        ordersDataRes = [{
          id: 3,
          order_number: '3',
          customer: { email: 'smridh@tandev.us' },
          first_item: {
            image_url: "https://images.unsplash.com/photo-1610189020382-668a64c0c7a6",
            title: "Saree 2"
          },
          fulfillment: { status: "CREATED" },
          item_count: 1,
          total_qty: 2,
          shop_subtotal: 4198,
          updated_at: new Date().toISOString()
        }];
      }

      setOrdersData(ordersDataRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getDate = (ts) => ts ? new Date(ts).toISOString().split('T')[0] : '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading orders...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Header title="Orders" />

        <View style={styles.content}>

          {/* WRAPPER */}
          <View style={styles.wrapper}>
            <Text style={styles.smallTitle}>Orders</Text>

            <Text style={styles.mainTitle}>
              Manage customer orders
            </Text>

            <Text style={styles.description}>
              Update status, add tracking, and keep customers informed.
            </Text>

            {/* INNER BOX */}
            <View style={styles.innerBox}>

              {ordersData.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text>No orders found</Text>
                </View>
              ) : (
                ordersData.map((item) => {
                  const status = item.fulfillment?.status || item.order_status || 'CREATED';

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() =>
                        navigation.navigate('orderDetailsScreen', { orderId: item.id })
                      }
                    >
                      <View style={styles.orderCard}>

                        <View style={styles.row}>

                          {/* LEFT */}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.orderTitle}>
                              Order #{item.order_number || item.id}
                            </Text>

                            <Text style={styles.orderMeta}>
                              {item.customer?.email} 
                            </Text>
                            <Text style={styles.orderMeta}>
                              · item {item.item_count || 1}
                            </Text>
                            <Text style={styles.orderMeta}>
                              · Qty {item.total_qty}
                            </Text>

                            <View style={styles.productRow}>
                              <Image
                                source={{ uri: item.first_item?.image_url }}
                                style={styles.productImage}
                              />
                              <Text style={styles.productName}>
                                {item.first_item?.title}
                              </Text>
                            </View>
                          </View>

                          {/* RIGHT */}
                          <View style={styles.rightSection}>

                            <View style={styles.statusPill}>
                              <Text style={styles.statusDot}>•</Text>
                              <Text style={styles.statusText}>
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                              </Text>
                            </View>

                            <View style={styles.priceContainer}>
                              <Text style={styles.priceValue}>₹ {item.shop_subtotal}</Text>
                              <Text style={styles.priceLabel}>Shop subtotal</Text>
                            </View>

                          </View>

                        </View>

                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrdersScreen;

/* ===================== STYLES ===================== */

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flex: 1 },
  content: { padding: 16 },

  /* WRAPPER */
  wrapper: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  smallTitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: 4,
    color: "#111827",
  },

  description: {
    fontSize: 14,
    color: "#4b5563",
    marginVertical: 10,
  },

  innerBox: {
    // backgroundColor: "#f9fafb",
    // borderRadius: 16,
    // padding: 10,
  },

  /* ORDER CARD */
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  row: {
    flexDirection: "row",
  },

  rightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginLeft: 10,
  },

  orderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  orderMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-end",
  },

  statusDot: {
    marginRight: 6,
  },

  statusText: {
    fontSize: 13,
    color: "#111827",
  },

  priceContainer: {
    alignItems: "flex-end",
    marginTop: 20,
  },

  priceValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },

  priceLabel: {
    fontSize: 12,
    color: "#6b7280",
  },

  productRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  productImage: {
    width: 45,
    height: 45,
    borderRadius: 12,
    marginRight: 10,
  },

  productName: {
    fontSize: 16,
    color: "#374151",
    flexShrink: 1,
  },

  /* STATES */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
});