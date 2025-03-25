import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDealsByBusinessOwner } from '../../api/dealService';

const DealsListScreen = ({ navigation }) => {
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load deals on mount
  useEffect(() => {
    fetchDeals();
  }, []);
  
  // Fetch deals
  const fetchDeals = async () => {
    try {
      const dealsData = await getDealsByBusinessOwner();
      setDeals(dealsData);
    } catch (error) {
      console.error('Error fetching deals:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeals();
  };
  
  // Create new deal
  const handleCreateDeal = () => {
    navigation.navigate('CreateDeal');
  };
  
  // View deal details
  const handleViewDeal = (deal) => {
    navigation.navigate('DealDetails', { dealId: deal.id });
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      case 'expired': return '#6c757d';
      default: return '#6c757d';
    }
  };
  
  // Format status label
  const formatStatus = (status) => {
    switch(status) {
      case 'approved': return 'Active';
      case 'pending': return 'Pending';
      case 'rejected': return 'Rejected';
      case 'expired': return 'Expired';
      default: return status;
    }
  };
  
  // Render deal item
  const renderDealItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.dealCard}
      onPress={() => handleViewDeal(item)}
    >
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle}>{item.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{formatStatus(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.businessName}>{item.businesses.name}</Text>
      <Text style={styles.dealDescription} numberOfLines={2}>{item.description}</Text>
      
      <View style={styles.dealMeta}>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount_value}% OFF</Text>
        </View>
        
        <Text style={styles.dateRange}>
          {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.createButton}
        onPress={handleCreateDeal}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.createButtonText}>Create New Deal</Text>
      </TouchableOpacity>
      
      {deals.length > 0 ? (
        <FlatList
          data={deals}
          renderItem={renderDealItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Deals Yet</Text>
          <Text style={styles.emptyText}>
            Create special deals to attract more customers to your businesses.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    justifyContent: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  businessName: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  dealMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dateRange: {
    fontSize: 12,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default DealsListScreen;