import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBusinessesByOwner } from '../../api/businessService';
import { BUSINESS_STATUS } from '../../api/businessService';

const statusColors = {
  [BUSINESS_STATUS.PENDING]: '#ffc107',
  [BUSINESS_STATUS.APPROVED]: '#28a745',
  [BUSINESS_STATUS.REJECTED]: '#dc3545',
};

const statusLabels = {
  [BUSINESS_STATUS.PENDING]: 'Pending Approval',
  [BUSINESS_STATUS.APPROVED]: 'Active',
  [BUSINESS_STATUS.REJECTED]: 'Rejected',
};

const BusinessesListScreen = ({ navigation }) => {
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load businesses on mount
  useEffect(() => {
    fetchBusinesses();
  }, []);
  
  // Fetch businesses owned by current user
  const fetchBusinesses = async () => {
    try {
      const businessesData = await getBusinessesByOwner();
      setBusinesses(businessesData);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBusinesses();
  };
  
  // Add new business
  const handleAddBusiness = () => {
    navigation.navigate('BusinessForm');
  };
  
  // View business details
  const handleViewBusiness = (business) => {
    navigation.navigate('BusinessDetails', { 
      businessId: business.id,
      name: business.name
    });
  };
  
  // Render business item
  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.businessCard}
      onPress={() => handleViewBusiness(item)}
    >
      <Image
        source={require('../../../assets/images/business-placeholder.png')}
        style={styles.businessLogo}
        resizeMode="cover"
      />
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{item.name}</Text>
        <Text style={styles.businessCategory}>
          {item.categories?.name || 'Uncategorized'}
        </Text>
        <View style={styles.businessMeta}>
          <Text style={styles.businessAddress} numberOfLines={1}>
            {item.address}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] }]}>
            <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
          </View>
        </View>
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
        style={styles.addButton}
        onPress={handleAddBusiness}
      >
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Add New Business</Text>
      </TouchableOpacity>
      
      {businesses.length > 0 ? (
        <FlatList
          data={businesses}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Businesses Yet</Text>
          <Text style={styles.emptyText}>
            Start by adding your first business to manage it on our platform.
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    padding: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  listContainer: {
    padding: 16,
  },
  businessCard: {
    flexDirection: 'row',
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
  businessLogo: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 4,
  },
  businessMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessAddress: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginRight: 8,
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

export default BusinessesListScreen;