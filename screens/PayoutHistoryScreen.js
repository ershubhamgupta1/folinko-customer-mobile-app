import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import Header from '../components/Header';
import { payouts } from '../services/api';

const PayoutHistoryScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [payoutData, setPayoutData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPayoutHistory();
  }, []);

  const fetchPayoutHistory = async () => {
    try {
      setLoading(true);
      const response = await payouts.getPayouts();
      console.log('Payout response:', response);
      
      // Mock data for testing if API returns empty
      let payoutList = response?.payouts || [];
      if (payoutList.length === 0) {
        payoutList = [
          {
            id: 1,
            amount: 2500.00,
            status: 'COMPLETED',
            payout_date: '2026-02-25T10:30:00Z',
            transaction_id: 'TXN123456789',
            bank_account: '****1234',
            payment_method: 'Bank Transfer',
            processing_fee: 25.00,
            net_amount: 2475.00,
            remarks: 'Monthly payout February 2026'
          },
          {
            id: 2,
            amount: 1800.00,
            status: 'PROCESSING',
            payout_date: '2026-02-28T14:15:00Z',
            transaction_id: 'TXN123456790',
            bank_account: '****1234',
            payment_method: 'Bank Transfer',
            processing_fee: 18.00,
            net_amount: 1782.00,
            remarks: 'Monthly payout February 2026 - Processing'
          },
          {
            id: 3,
            amount: 3200.00,
            status: 'FAILED',
            payout_date: '2026-02-20T09:45:00Z',
            transaction_id: 'TXN123456791',
            bank_account: '****1234',
            payment_method: 'Bank Transfer',
            processing_fee: 32.00,
            net_amount: 3168.00,
            remarks: 'Bank account verification failed'
          },
          {
            id: 4,
            amount: 1500.00,
            status: 'COMPLETED',
            payout_date: '2026-02-15T11:20:00Z',
            transaction_id: 'TXN123456792',
            bank_account: '****1234',
            payment_method: 'Bank Transfer',
            processing_fee: 15.00,
            net_amount: 1485.00,
            remarks: 'Weekly payout'
          },
          {
            id: 5,
            amount: 4200.00,
            status: 'COMPLETED',
            payout_date: '2026-02-10T16:00:00Z',
            transaction_id: 'TXN123456793',
            bank_account: '****1234',
            payment_method: 'Bank Transfer',
            processing_fee: 42.00,
            net_amount: 4158.00,
            remarks: 'Monthly payout January 2026'
          }
        ];
      }
      setPayoutData(payoutList);
    } catch (error) {
      console.error('Error fetching payout history:', error);
      Alert.alert('Error', 'Failed to load payout history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPayoutHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return '#4CAF50';
      case 'PROCESSING':
        return '#FF9800';
      case 'FAILED':
        return '#F44336';
      case 'PENDING':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'check-circle';
      case 'PROCESSING':
        return 'clock';
      case 'FAILED':
        return 'times-circle';
      case 'PENDING':
        return 'hourglass-half';
      default:
        return 'question-circle';
    }
  };

  const renderPayoutItem = (item) => (
    <View key={item.id} style={styles.payoutCard}>
      <View style={styles.payoutHeader}>
        <View style={styles.payoutAmount}>
          <Text style={styles.amountText}>₹{item.amount?.toFixed(2) || '0.00'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <FontAwesome5 
              name={getStatusIcon(item.status)} 
              size={12} 
              color="#fff" 
              style={styles.statusIcon} 
            />
            <Text style={styles.statusText}>{item.status || 'PENDING'}</Text>
          </View>
        </View>
        <Text style={styles.dateText}>{formatDate(item.payout_date)}</Text>
      </View>

      <View style={styles.payoutDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Transaction ID:</Text>
          <Text style={styles.detailValue}>{item.transaction_id || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Payment Method:</Text>
          <Text style={styles.detailValue}>{item.payment_method || 'Bank Transfer'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Bank Account:</Text>
          <Text style={styles.detailValue}>{item.bank_account || 'N/A'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Processing Fee:</Text>
          <Text style={styles.detailValue}>₹{item.processing_fee?.toFixed(2) || '0.00'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Net Amount:</Text>
          <Text style={[styles.detailValue, styles.netAmount]}>₹{item.net_amount?.toFixed(2) || '0.00'}</Text>
        </View>
        {item.remarks && (
          <View style={styles.remarksRow}>
            <Text style={styles.remarksLabel}>Remarks:</Text>
            <Text style={styles.remarksText}>{item.remarks}</Text>
          </View>
        )}
      </View>

      {item.status === 'FAILED' && (
        <View style={styles.failedAlert}>
          <FontAwesome name="exclamation-triangle" size={16} color="#F44336" />
          <Text style={styles.failedText}>Payment failed. Please check your bank details.</Text>
        </View>
      )}
    </View>
  );

  if (loading && payoutData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading payout history...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Header 
        title="Payout History"
        onNotificationPress={() => console.log('Notification pressed')}
        onProfilePress={() => navigation.navigate('dashboard')}
      />
      <View style={styles.content}>
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <FontAwesome5 name="rupee-sign" size={20} color="#000" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Total Payouts</Text>
              <Text style={styles.summaryValue}>
                ₹{payoutData.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2)}
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <FontAwesome5 name="check-circle" size={20} color="#4CAF50" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={styles.summaryValue}>
                {payoutData.filter(item => item.status === 'COMPLETED').length}
              </Text>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}>
              <FontAwesome5 name="clock" size={20} color="#FF9800" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Processing</Text>
              <Text style={styles.summaryValue}>
                {payoutData.filter(item => item.status === 'PROCESSING').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Payout List */}
        <View style={styles.payoutSection}>
          <Text style={styles.sectionTitle}>Payout History</Text>
          
          {payoutData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="money-bill-wave" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No payout history found</Text>
              <Text style={styles.emptySubText}>Your payout records will appear here</Text>
            </View>
          ) : (
            payoutData.map(renderPayoutItem)
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <FontAwesome5 name="download" size={20} color="#000" />
              </View>
              <Text style={styles.actionText}>Download Statement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <FontAwesome5 name="bank" size={20} color="#000" />
              </View>
              <Text style={styles.actionText}>Bank Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <FontAwesome5 name="headset" size={20} color="#000" />
              </View>
              <Text style={styles.actionText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <FontAwesome5 name="question-circle" size={20} color="#000" />
              </View>
              <Text style={styles.actionText}>Help</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  summarySection: {
    flexDirection: 'row',
    gap: 15,
    marginVertical: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryContent: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  payoutSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  payoutCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  payoutAmount: {
    flex: 1,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  payoutDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  netAmount: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  remarksRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  remarksLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 12,
    color: '#000',
    fontStyle: 'italic',
  },
  failedAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
  },
  failedText: {
    fontSize: 12,
    color: '#F44336',
    marginLeft: 8,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 12,
    color: '#999',
  },
  actionsSection: {
    marginBottom: 30,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionText: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
  },
});

export default PayoutHistoryScreen;
