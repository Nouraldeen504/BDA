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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getActiveDeals } from '../../api/dealService';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

const DealsScreen = ({ navigation }) => {
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load deals when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchDeals();
      return () => {};
    }, [])
  );

  // Fetch active deals
  const fetchDeals = async () => {
    setError(null);
    
    try {
      const activeDeals = await getActiveDeals();
      setDeals(activeDeals);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setError('Failed to load deals. Please try again later.');
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

  // Calculate days remaining until deal expires
  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const expiryDate = new Date(endDate);
    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  // Render deal item
  const renderDealItem = ({ item }) => {
    const daysRemaining = getDaysRemaining(item.end_date);
    return (
      <TouchableOpacity
        style={styles.dealCard}
        onPress={() => navigation.navigate('BusinessDetail', { 
          id: item.businesses.id, 
          name: item.businesses.name,
          activeTab: 'deals'
        })}
      >
        <View style={styles.dealHeader}>
          <View style={styles.businessInfo}>
            <Image
              source={item.businesses.logo_url 
                ? { uri: item.businesses.logo_url } 
                : require('../../../assets/images/business-placeholder.png')}
              style={styles.businessLogo}
              resizeMode="cover"
            />
            <View>
              <Text style={styles.businessName}>{item.businesses.name}</Text>
              <Text style={styles.businessCategory}>
                {item.businesses.categories?.name || 'Business'}
              </Text>
            </View>
          </View>
          <View style={styles.dealDiscount}>
            <Text style={styles.discountText}>{item.discount_value}% OFF</Text>
          </View>
        </View>
        
        <Text style={styles.dealTitle}>{item.title}</Text>
        <Text style={styles.dealDescription} numberOfLines={3}>{item.description}</Text>
        
        <View style={styles.dealFooter}>
          <View style={styles.expiryContainer}>
            <Ionicons name="time-outline" size={16} color="#ff6b6b" />
            <Text style={styles.expiryText}>
              {daysRemaining <= 0
                ? 'Expires today!'
                : `Expires in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`}
            </Text>
          </View>
          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>View Details</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Special Deals</Text>
        <Text style={styles.headerSubtitle}>
          Exclusive deals from local businesses
        </Text>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Deals list */}
      {deals.length > 0 ? (
        <FlatList
          data={deals}
          renderItem={renderDealItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="pricetag-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Active Deals</Text>
          <Text style={styles.emptyText}>
            There are no active deals at the moment. Check back later for special offers from local businesses.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Text style={styles.exploreButtonText}>Explore Businesses</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
  },
  listContainer: {
    padding: 16,
  },
  dealCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  businessLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  businessCategory: {
    fontSize: 12,
    color: '#666',
  },
  dealDiscount: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dealDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  expiryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#ff6b6b',
  },
  actionButton: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
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
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DealsScreen;