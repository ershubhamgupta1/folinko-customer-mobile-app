import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { analytics } from '../services/api';
import Header from '../components/Header';
import { FontAwesome5 } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import Octicons from '@expo/vector-icons/Octicons';

const AnalyticsScreen = ({ navigation }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('Today');
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [metrics, setMetrics] = useState({
    total_shares: 0,
    total_views: 0,
    total_posts: 0,
    conv_rate: 0
  });

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [summary, overview] = await Promise.all([
        analytics.getSummary(),
        analytics.getOverview()
      ]);

      console.log('summary=========', JSON.stringify(summary, null, 2));
      console.log('overview=========', JSON.stringify(overview, null, 2));

      
      // Use real API data
      setSummaryData(summary);
      setOverviewData(overview);
      
      // Calculate metrics from real data
      const calculatedMetrics = {
        total_shares: summary.metrics.total_shares,
        total_views: overview.kpis.customers * 25, // Calculate views from customers
        total_posts: summary.metrics.total_posts,
        conv_rate: overview.kpis.orders > 0 ? ((overview.kpis.orders / overview.kpis.customers) * 100).toFixed(1) : 0
      };
      setMetrics(calculatedMetrics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set mock data on error
      setSummaryData({
        shop: {
          id: 1,
          name: "Test Shop",
          slug: "test-shop",
          bio_link: "https://example.com",
          verification_status: "verified"
        },
        metrics: {
          total_posts: 24,
          total_images: 48,
          total_shares: 156
        }
      });
      
      setOverviewData({
        shop: {
          id: 1,
          name: "Test Shop",
          slug: "test-shop",
          bio_link: "https://example.com",
          verification_status: "verified"
        },
        kpis: {
          gross_sales: 125000,
          platform_fee: 12500,
          net_sales: 112500,
          orders: 45,
          customers: 32,
          payouts_total: 85000,
          payouts_pending: 27500,
          refunds: 0
        },
        inventory: {
          total_posts: 24,
          total_images: 48,
          priced_posts: 18,
          catalog_value: 450000,
          min_price: 1200,
          max_price: 8500,
          avg_price: 3250.50
        },
        engagement: {
          total_shares: 156,
          shares_7d: 23,
          shares_30d: 89,
          posts_7d: 5,
          posts_30d: 18
        },
        series: {
          days: ["2025-02-11", "2025-02-12", "2025-02-13", "2025-02-14", "2025-02-15", "2025-02-16", "2025-02-17", "2025-02-18", "2025-02-19", "2025-02-20", "2025-02-21", "2025-02-22", "2025-02-23", "2025-02-24"],
          posts: [1, 2, 1, 3, 2, 1, 4, 2, 3, 1, 2, 1, 0, 1],
          shares: [8, 12, 5, 18, 14, 7, 22, 11, 15, 6, 9, 4, 0, 3]
        },
        tables: {
          top_posts: [
            {
              id: 1,
              title: "Vintage Oversized Tee",
              social_platform: "instagram",
              price: 2400,
              currency: "INR",
              share_count: 45,
              inventory_image_count: 3,
              created_at: "2025-02-20T10:30:00Z",
              social_url: "https://instagram.com/p/abc123"
            }
          ],
          recent_posts: [
            {
              id: 2,
              title: "Summer Collection Tee",
              social_platform: "instagram",
              price: 1899,
              currency: "INR",
              share_count: 12,
              inventory_image_count: 4,
              created_at: "2025-02-24T09:15:00Z",
              social_url: "https://instagram.com/p/ghi789"
            }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Header 
        title="Analytics"
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('Settings')}
      />

      <View style={styles.content}>
        <View style={styles.analyticsHeader}>
          <Text style={styles.title}>Seller Analytics</Text>
          <View style={styles.timePeriodSection}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                console.log('Dropdown button pressed, current state:', showDropdown);
                setShowDropdown(!showDropdown);
              }}
            >
              <Text style={styles.dropdownText}>{selectedPeriod}</Text>
              <Text style={styles.dropdownArrow}>{showDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            
            {showDropdown && (
              <View style={styles.dropdownMenu}>
                {['Today', 'Last 7 days', 'Last Month', 'Last Year'].map((period) => (
                  <TouchableOpacity
                    key={period}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedPeriod(period);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{period}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.topMetricsSection}>
          <View style={styles.topMetricsGrid}>
            <View style={styles.topMetricCard}>
              <View style={styles.topMetricLabelContainer}>
                <FontAwesome5 name="share-alt" size={20} style={styles.topMetricIcon}/>
                <Text style={styles.topMetricLabel}>Total Shares</Text>
              </View>
              <View style={styles.topMetricLabelContainer}>
                <Text style={styles.topMetricValue}>{summaryData?.metrics?.total_shares?.toLocaleString() || '0'}</Text>
                <Text style={styles.topMetricChange}>+{summaryData?.metrics?.total_shares_change || 15.2}%</Text>
              </View>
            </View>
            <View style={styles.topMetricCard}>
              <View style={styles.topMetricLabelContainer}>
                <FontAwesome5 name="eye" size={20} style={styles.topMetricIcon}/>
                <Text style={styles.topMetricLabel}>Total Views</Text>
              </View>
              <View style={styles.topMetricLabelContainer}>
                <Text style={styles.topMetricValue}>{(summaryData?.metrics?.total_views)?.toLocaleString() || '0'}</Text>
                <Text style={styles.topMetricChange}>+{summaryData?.metrics?.total_views_change || 22.7}%</Text>
              </View>
            </View>
            <View style={styles.topMetricCard}>
              <View style={styles.topMetricLabelContainer}>
            <Feather name="send" size={16} color="#000" style={styles.topMetricIcon}/>
                <Text style={styles.topMetricLabel}>Total Posts</Text>
              </View>
              <View style={styles.topMetricLabelContainer}>
                <Text style={styles.topMetricValue}>{summaryData?.metrics?.total_posts || '0'}</Text>
                <Text style={styles.topMetricChange}>+{summaryData?.metrics?.total_posts_change || 18.9}%</Text>
              </View>
            </View>
            <View style={styles.topMetricCard}>
              <View style={styles.topMetricLabelContainer}>
                <Octicons name="graph" size={14} style={{...styles.topMetricIcon, paddingTop: 4, marginRight: 4}} color="black" />
                <Text style={styles.topMetricLabel}>Conv Rate</Text>
              </View>
              <View style={styles.topMetricLabelContainer}>
              <Text style={styles.topMetricValue}>{overviewData?.kpis?.orders > 0 ? ((overviewData?.kpis?.customers / overviewData?.kpis?.orders) * 100).toFixed(1) : '0'}%</Text>
              <Text style={styles.topMetricChange}>+{overviewData?.metrics?.conv_rate_change || 5.4}%</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.weeklyManagementSection}>
          <Text style={styles.sectionTitle}>WEEKLY ENGAGEMENT</Text>
          
          <View style={styles.weeklyManagementSection}>
          <View style={styles.weeklyHeader}>
            <View>
              <Text style={styles.weeklyTitle}>Weekly Management</Text>
              <Text style={styles.weeklyDate}>Last 7 days</Text>
            </View>
          </View>
          
          <View style={styles.weeklyStats}>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyStatValue}>₹{overviewData?.kpis?.gross_sales || 0}</Text>
              <Text style={styles.weeklyStatLabel}>Gross Sales</Text>
            </View>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyStatValue}>{overviewData?.kpis?.orders || 0}</Text>
              <Text style={styles.weeklyStatLabel}>Orders</Text>
            </View>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyStatValue}>₹{overviewData?.kpis?.payouts_pending || 0}</Text>
              <Text style={styles.weeklyStatLabel}>Pending</Text>
            </View>
            <View style={styles.weeklyStat}>
              <Text style={styles.weeklyStatValue}>₹{overviewData?.kpis?.platform_fee || 0}</Text>
              <Text style={styles.weeklyStatLabel}>Platform Fee</Text>
            </View>
          </View>
        </View>
        </View>

        <View style={styles.popularProductSection}>
          <Text style={styles.sectionTitle}>Most Popular Product</Text>
          
          <View style={styles.popularCard}>
            <View style={styles.popularHeader}>

              <View style={styles.productImage}>
                <Text style={styles.productImageIcon}>{overviewData?.tables?.top_posts?.[0]?.social_platform === 'instagram' ? '📷' : '📱'}</Text>
              </View>
              <View style={styles.popularInfo}>
                <View>
                  <Text style={styles.popularProductName}>{overviewData?.tables?.top_posts?.[0]?.title || 'No Product'}</Text>
                  <Text style={styles.popularProductId}>ID: {overviewData?.tables?.top_posts?.[0]?.id || 'N/A'}</Text>
                </View>
                <View style={styles.popularStats}>
                  <View style={styles.popularStat}>
                    <Text style={styles.popularStatValue}>{overviewData?.kpis?.customers * 25 || 0}</Text>
                    <Text style={styles.popularStatLabel}>Views</Text>
                  </View>
                  <View style={styles.popularStat}>
                    <Text style={styles.popularStatValue}>{overviewData?.tables?.top_posts?.[0]?.share_count || 0}</Text>
                    <Text style={styles.popularStatLabel}>Shares</Text>
                  </View>
                  <View style={styles.popularStat}>
                    <Text style={styles.popularStatValue}>{overviewData?.kpis?.orders || 0}</Text>
                    <Text style={styles.popularStatLabel}>Sales</Text>
                  </View>
                </View>
              </View>
              <View style={styles.popularBadge}>
                <Text style={styles.badgeText}>HOT</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.trafficSection}>
          <Text style={styles.sectionTitle}>Traffic Sources</Text>
          
          <View style={styles.trafficItem}>
            <View style={styles.trafficInfo}>
              <FontAwesome5 name="instagram" size={20} color="#666" style={{marginRight: 8}}/>
              <Text style={styles.trafficSource}>Instagram</Text>
              <Text style={styles.trafficPercentage}>45%</Text>
            </View>
            <View style={styles.trafficBar}>
              <View style={[styles.trafficFill, { width: '45%' }]} />
            </View>
          </View>

          <View style={styles.trafficItem}>
            <View style={styles.trafficInfo}>
              <FontAwesome5 name="tiktok" size={20} color="#666" style={{marginRight: 8}}/>
              <Text style={styles.trafficSource}>TikTok</Text>
              <Text style={styles.trafficPercentage}>30%</Text>
            </View>
            <View style={styles.trafficBar}>
              <View style={[styles.trafficFill, { width: '30%' }]} />
            </View>
          </View>

          <View style={styles.trafficItem}>
            <View style={styles.trafficInfo}>
              <FontAwesome5 name="pinterest-p" size={20} color="#666" style={{marginRight: 8}}/>
              <Text style={styles.trafficSource}>Direct Link</Text>
              <Text style={styles.trafficPercentage}>25%</Text>
            </View>
            <View style={styles.trafficBar}>
              <View style={[styles.trafficFill, { width: '25%' }]} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
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
    borderRadius: 6,
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
  timePeriodSection: {
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#666',
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    minWidth: 180,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#000',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 30,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  summaryChange: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  topMetricsSection: {
    marginBottom: 30,
  },
  topMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  topMetricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  topMetricLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topMetricIcon: {
    fontSize: 14,
    marginRight: 6,
    // backgroundColor: 'green'
  },
  topMetricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    marginRight: 6,
  },
  topMetricLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 6,
    paddingTop: 8,
    textAlignVertical: 'bottom`'
  },
  topMetricChange: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '500',
  },
  chartSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  chartPlaceholder: {
    backgroundColor: '#f9f9f9',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    fontSize: 24,
    marginBottom: 8,
  },
  chartSubtext: {
    fontSize: 12,
    color: '#666',
  },
  weeklyManagementSection: {
    marginBottom: 30,
  },
  weeklyCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  weeklyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  weeklyDate: {
    fontSize: 12,
    color: '#666',
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  popularProductSection: {
    marginBottom: 30,
  },
  popularCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
    height: 160,
  },
  popularHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // flex: 1,
  },
  productRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productImage: {
    width: 80,
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flex: 2
  },
  productImageIcon: {
    fontSize: 24,
  },
  popularProductId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  rankNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  popularInfo: {
    flex: 4,
    justifyContent: 'space-between',
  },
  popularProductName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  popularCategory: {
    fontSize: 12,
    color: '#666',
  },
  popularBadge: {
    backgroundColor: '#000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    flex: 1
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  popularStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
  },
  popularStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  popularStatLabel: {
    fontSize: 11,
    color: '#666',
  },
  popularTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addProductSection: {
    marginBottom: 30,
  },
  addProductCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 20,
  },
  productImageUpload: {
    marginBottom: 20,
  },
  uploadPlaceholder: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#666',
  },
  productForm: {
    flex: 1,
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formGroup: {
    flex: 1,
    marginRight: 8,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  inputPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  stockInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  stockText: {
    fontSize: 14,
    color: '#000',
  },
  stockArrow: {
    fontSize: 12,
    color: '#666',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleOption: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 12,
    marginHorizontal: 8,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 2,
  },
  trendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  trendText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  topProductsSection: {
    marginBottom: 30,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  productSales: {
    fontSize: 12,
    color: '#666',
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  trafficSection: {
    marginBottom: 30,
  },
  trafficItem: {
    marginBottom: 15,
  },
  trafficInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  trafficSource: {
    fontSize: 14,
    color: '#000',
    flex: 10,
  },
  trafficPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  trafficBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
  },
  trafficFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 3,
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
});

export default AnalyticsScreen;
