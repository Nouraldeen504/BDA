import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getBusinessesByOwner } from '../../api/businessService';
import { getDealsByBusinessOwner } from '../../api/dealService';
import { BUSINESS_STATUS } from '../../api/businessService';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

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

const BusinessOwnerDashboardScreen = ({ navigation }) => {
  const { profile } = useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch businesses and deals
  const fetchData = async () => {
    setError(null);
    
    try {
      // Fetch businesses owned by the current user
      const businessesData = await getBusinessesByOwner();
      setBusinesses(businessesData);

      // Fetch deals for these businesses
      const dealsData = await getDealsByBusinessOwner();
      setDeals(dealsData);
    } catch (error) {
      console.error('Error fetching business owner data:', error);
      setError('Failed to load your data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Count businesses by status
  const getBusinessCountByStatus = (status) => {
    return businesses.filter(business => business.status === status).length;
  };

  // Count active deals
  const getActiveDealsCount = () => {
    const today = new Date().toISOString();
    return deals.filter(
      deal => deal.status === 'approved' && deal.start_date <= today && deal.end_date >= today
    ).length;
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Welcome header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{profile?.display_name || 'Business Owner'}</Text>
        </View>
        <TouchableOpacity
          style={styles.addBusinessButton}
          onPress={() => navigation.navigate('BusinessForm')}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBusinessButtonText}>Add Business</Text>
        </TouchableOpacity>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Stats summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{businesses.length}</Text>
          <Text style={styles.statLabel}>Total Businesses</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getBusinessCountByStatus(BUSINESS_STATUS.APPROVED)}</Text>
          <Text style={styles.statLabel}>Active Businesses</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{getActiveDealsCount()}</Text>
          <Text style={styles.statLabel}>Active Deals</Text>
        </View>
      </View>

      {/* Businesses section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Businesses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BusinessesList')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {businesses.length > 0 ? (
          businesses.slice(0, 3).map((business) => (
            <TouchableOpacity
              key={business.id}
              style={styles.businessCard}
              onPress={() => navigation.navigate('BusinessDetails', { businessId: business.id })}
            >
              <Image
                source={
                  business.logo_url
                    ? { uri: business.logo_url }
                    : require('../../../assets/images/business-placeholder.png')
                }
                style={styles.businessLogo}
                resizeMode="cover"
              />
              <View style={styles.businessInfo}>
                <Text style={styles.businessName}>{business.name}</Text>
                <Text style={styles.businessCategory}>
                  {business.categories?.name || 'Business'}
                </Text>
                <View style={styles.businessMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColors[business.status] }]}>
                    <Text style={styles.statusText}>{statusLabels[business.status]}</Text>
                  </View>
                  
                  {business.status === BUSINESS_STATUS.APPROVED && (
                    <View style={styles.reviewsContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.reviewsText}>
                        {business.averageRating ? business.averageRating.toFixed(1) : 'New'} 
                        {business.totalReviews > 0 && ` (${business.totalReviews})`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="business-outline" size={40} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Businesses Yet</Text>
            <Text style={styles.emptyStateText}>
              Start by adding your first business to manage it on our platform.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('BusinessForm')}
            >
              <Text style={styles.emptyStateButtonText}>Add a Business</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Recent deals section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Deals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DealsList')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {deals.length > 0 ? (
          deals.slice(0, 3).map((deal) => (
            <TouchableOpacity
              key={deal.id}
              style={styles.dealCard}
              onPress={() => navigation.navigate('DealDetails', { dealId: deal.id })}
            >
              <View style={styles.dealHeader}>
                <View>
                  <Text style={styles.dealTitle}>{deal.title}</Text>
                  <Text style={styles.dealBusiness}>{deal.businesses.name}</Text>
                </View>
                <View style={styles.dealDiscount}>
                  <Text style={styles.discountText}>{deal.discount_value}% OFF</Text>
                </View>
              </View>
              
              <View style={styles.dealDates}>
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.datesText}>
                  {new Date(deal.start_date).toLocaleDateString()} - {new Date(deal.end_date).toLocaleDateString()}
                </Text>
              </View>
              
              <View style={[styles.statusBadge, { 
                backgroundColor: 
                  deal.status === 'approved' ? '#28a745' : 
                  deal.status === 'pending' ? '#ffc107' : 
                  deal.status === 'rejected' ? '#dc3545' : '#6c757d'
              }]}>
                <Text style={styles.statusText}>
                  {deal.status === 'approved' ? 'Active' : 
                   deal.status === 'pending' ? 'Pending Approval' : 
                   deal.status === 'rejected' ? 'Rejected' : 'Expired'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="pricetag-outline" size={40} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Deals Yet</Text>
            <Text style={styles.emptyStateText}>
              Create special deals to attract more customers to your businesses.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('CreateDeal')}
            >
              <Text style={styles.emptyStateButtonText}>Create a Deal</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Quick actions */}
      <View style={styles.quickActionsContainer}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('BusinessForm')}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007bff" />
            <Text style={styles.quickActionText}>Add Business</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('CreateDeal')}
          >
            <Ionicons name="pricetag-outline" size={24} color="#28a745" />
            <Text style={styles.quickActionText}>Create Deal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ReviewsList')}
          >
            <Ionicons name="star-outline" size={24} color="#ffc107" />
            <Text style={styles.quickActionText}>View Reviews</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('BusinessOwnerProfile')}
          >
            <Ionicons name="person-outline" size={24} color="#6c757d" />
            <Text style={styles.quickActionText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addBusinessButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  addBusinessButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    color: '#007bff',
    fontSize: 14,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  businessLogo: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 12,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  businessMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  reviewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  emptyStateCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  dealCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dealBusiness: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dealDiscount: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dealDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  datesText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  quickActionsContainer: {
    padding: 16,
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    color: '#333',
    marginTop: 8,
    fontWeight: '500',
  },
});

export default BusinessOwnerDashboardScreen;