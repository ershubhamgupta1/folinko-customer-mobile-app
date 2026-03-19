import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { feed, orders } from '../services/api';
import Header from '../components/Header';
import { SafeAreaView } from "react-native-safe-area-context";

const OrdersScreen = ({ navigation }) => {
  const [autoDecrement, setAutoDecrement] = useState(true);
  const [lowStockNotification, setLowStockNotification] = useState(false);
  const [selectedTab, setSelectedTab] = useState('new');
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Don't show loading indicator if just refreshing
      if (!refreshing) {
        setLoading(true);
      }
      const response = await orders?.getOrders();
      const feeds = await feed?.getFeed();

      let ordersDataRes = response?.orders || [];
      // Add mock data for testing if API returns empty
      if (ordersDataRes.length === 0) {
        ordersDataRes = [{
          "created_at": "2026-02-25T14:52:52.201587Z", 
          "customer": {
            "email": "smridh@tandev.us", "id": 4}, 
            "first_item": {
              "image_url": 
              "https://instagram.fixc11-1.fna.fbcdn.net/v/t51.82787-15/619600416_18077553527360525_1576591170252182596_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=103&ig_cache_key=MjcwODEwMzA5NTM2Nzc1NTMwMQ%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTgwMC5zZHIuQzMifQ%3D%3D&_nc_ohc=z51EFAUBRvAQ7kNvwFM2uEs&_nc_oc=Adkb1-kcGq5rbYiEICyuHGTD99n1SwVT3Bo15f9XxhNU8k7NJWZkd3NXfN_J-4t_Q3I&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fixc11-1.fna&_nc_gid=UD5HQuYsn4MsOiaVXVQOow&oh=00_AfsX2M1M46B8vEDA_uUBpl6YmD8T9xgbxwx-6CffrYBr3A&oe=69A4D136",
              "post_id": 1, "title": "Silk Saree"}, 
              "fulfillment": {"delivered_at": null, "shipped_at": "2026-02-25T14:57:09.176478Z", "status": "SHIPPED", "tracking_code": "DELHI1234", "tracking_url": "https://google.com", "updated_at": "2026-02-25T14:57:09.176959Z"}, 
              "id": 1, "item_count": 1, "order_status": "CREATED", "shop_subtotal": 1499, 
              "total_qty": 1, "updated_at": "2026-02-25T14:52:52.202778Z"}];
      }
      setOrdersData(ordersDataRes);
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Set mock data on error as well
      setOrdersData([
        {
          id: 1,
          order_number: 'ORD-2025-882',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await orders.updateFulfillment(orderId, { status });
      await fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

const getDateFromTimestamp = (timestamp)=> {
  if(!timestamp) return ''
  const date = new Date(timestamp);
  return date.toISOString?.().split('T')[0];
}


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header 
          title="Orders"
          onNotificationPress={() => console.log('Notification pressed')}
          onProfilePress={() => navigation.navigate('userProfile')}
        />
        <View style={styles.content}>

          <View style={styles.pendingSection}>
            {ordersData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders found</Text>
              </View>
            ) : (
              ordersData.map((item) => {
                const currentStatus = item.fulfillment?.status || item.order_status;
                return (
                <TouchableOpacity key={item.id} onPress={()=>{navigation.navigate('orderDetailsScreen', {orderId: item.id})}}>
                  <View  style={styles.orderCard}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderId}>#{item.order_number || `ORD-${item.id}`}</Text>
                      <View style={[
                        currentStatus === 'CREATED' ? styles.newBadge : 
                        currentStatus === 'PACKED' ? styles.progressBadge : 
                        currentStatus === 'SHIPPED' ? styles.shippedBadge :
                        currentStatus === 'DELIVERED' ? styles.deliveredBadge :
                        currentStatus === 'CANCELLED' ? styles.cancelledBadge :
                        styles.newBadge
                      ]}>
                        <Text style={[
                          currentStatus === 'CREATED' ? styles.newBadgeText : 
                          currentStatus === 'PACKED' ? styles.progressBadgeText : 
                          currentStatus === 'SHIPPED' ? styles.shippedBadgeText :
                          currentStatus === 'DELIVERED' ? styles.deliveredBadgeText :
                          currentStatus === 'CANCELLED' ? styles.cancelledBadgeText :
                          styles.newBadgeText
                        ]}>
                          {currentStatus || 'NEW'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.productInfo}>
                      <View style={styles.productImage}>
                        {item.first_item?.image_url ? (
                          <Image
                            source={{ uri: item.first_item?.image_url}} 
                            style={styles.productIcon} 
                          />
                        ) : (
                          <Text style={styles.noImageText}>No Image</Text>
                        )}
                      </View>
                      <View style={styles.productDetails}>
                        <Text style={styles.productName}>
                          {item.first_item?.title || 'No product title'}
                        </Text>
                        <Text style={styles.stockInfo}>
                          {getDateFromTimestamp(item.updated_at)}
                        </Text>
                        <Text style={styles.stockInfo}>
                          Qty {item.total_qty}
                        </Text>
                        <Text style={styles.price}>
                          ₹{item.shop_subtotal || '0'} +GST
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
    
  );
};

const styles = StyleSheet.create({
  safeArea: {
      flex: 1,
      backgroundColor: "#fff"
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 15,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    paddingHorizontal: 20,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  ordersTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f5f5f5',
  },
  filterText: {
    fontSize: 14,
    color: '#000',
    marginRight: 4,
  },
  filterArrow: {
    fontSize: 12,
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  pendingSection: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    // marginBottom: 15,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  newBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  progressBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  progressBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 10,
  },
  productInfo: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'stretch'
  },
  productImage: {
    width: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productIcon: {
    fontSize: 24,
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover'
  },
  noImageText: {
    fontSize: 10,
    color: '#999',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  stockInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    borderRadius: 6,
    marginRight: 10,
  },
  completeButton: {
    backgroundColor: '#f0f0f0',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  completeButtonText: {
    color: '#000',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    fontSize: 18,
  },
  phoneIcon: {
    fontSize: 18,
  },
  stockNote: {
    fontSize: 11,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  inventorySection: {
    marginBottom: 30,
    backgroundColor:'#f5f5f5',
    padding: 15,
    borderRadius: 8,

  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshIcon: {
    padding: 4,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#666',
  },
  shippedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shippedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deliveredBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deliveredBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  cancelledBadge: {
    backgroundColor: '#F44336',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelledBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default OrdersScreen;
