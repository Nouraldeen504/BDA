import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getBusinessById } from '../../api/businessService';
import { getBusinessReviewStats } from '../../api/reviewService';
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

const BusinessDetailsScreen = ({ route, navigation }) => {
  const { businessId } = route.params;
  const { user } = useAuth();
  
  const [business, setBusiness] = useState(null);
  const [reviewStats, setReviewStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load business data
  useEffect(() => {
    fetchBusinessData();
  }, [businessId]);

  // Fetch business data and stats
  const fetchBusinessData = async () => {
    setError(null);
    
    try {
      // Fetch business details
      const businessData = await getBusinessById(businessId);
      setBusiness(businessData);
      
      // Fetch review stats
      const stats = await getBusinessReviewStats(businessId);
      setReviewStats(stats);
    } catch (error) {
      console.error('Error fetching business details:', error);
      setError('Failed to load business information. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBusinessData();
  };

  // Navigate to edit business screen
  const handleEditBusiness = () => {
    navigation.navigate('BusinessForm', { 
      businessId: business.id,
      name: business.name
    });
  };

  // Navigate to create deal screen
  const handleCreateDeal = () => {
    navigation.navigate('CreateDeal', { businessId: business.id });
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  // Show error message
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Business not found or not accessible
  if (!business) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="business-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Business not found or you don't have permission to view it</Text>
        <TouchableOpacity
          style={styles.errorButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
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
      {/* Business Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: statusColors[business.status] }]}>
        <Text style={styles.statusText}>{statusLabels[business.status]}</Text>
        {business.status === BUSINESS_STATUS.REJECTED && business.rejection_reason && (
          <Text style={styles.rejectionText}>Reason: {business.rejection_reason}</Text>
        )}
      </View>

      {/* Header Images */}
      <View style={styles.imageContainer}>
        <Image
          source={
            business.cover_image
              ? { uri: business.cover_image }
              : require('../../../assets/images/business-cover-placeholder.png')
          }
          style={styles.coverImage}
          resizeMode="cover"
        />
        <View style={styles.logoContainer}>
          <Image
            source={
              business.logo_url
                ? { uri: business.logo_url }
                : require('../../../assets/images/business-placeholder.png')
            }
            style={styles.logoImage}
            resizeMode="cover"
          />
        </View>
      </View>

      {/* Business Info */}
      <View style={styles.businessHeader}>
        <Text style={styles.businessName}>{business.name}</Text>
        
        <View style={styles.categoryRow}>
          <View style={styles.category}>
            <Text style={styles.categoryText}>{business.categories?.name || 'Business'}</Text>
          </View>
          
          {reviewStats && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {reviewStats.averageRating.toFixed(1)} 
                {reviewStats.totalReviews > 0 && ` (${reviewStats.totalReviews})`}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleEditBusiness}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Edit Business</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            business.status !== BUSINESS_STATUS.APPROVED && styles.disabledButton
          ]}
          onPress={business.status === BUSINESS_STATUS.APPROVED ? handleCreateDeal : null}
          disabled={business.status !== BUSINESS_STATUS.APPROVED}
        >
          <Ionicons name="pricetag-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Create Deal</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
          onPress={() => setActiveTab('reviews')}
        >
          <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
            Reviews
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'deals' && styles.activeTab]}
          onPress={() => setActiveTab('deals')}
        >
          <Text style={[styles.tabText, activeTab === 'deals' && styles.activeTabText]}>
            Deals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View>
            {/* Business Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Details</Text>
              
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.infoLabel}>Created:</Text>
                <Text style={styles.infoValue}>
                  {new Date(business.created_at).toLocaleDateString()}
                </Text>
              </View>
              
              {business.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionTitle}>Description:</Text>
                  <Text style={styles.descriptionText}>{business.description}</Text>
                </View>
              )}
            </View>
            
            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact Information</Text>
              
              {business.address && (
                <View style={styles.infoItem}>
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{business.address}</Text>
                </View>
              )}
              
              {business.phone && (
                <View style={styles.infoItem}>
                  <Ionicons name="call-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{business.phone}</Text>
                </View>
              )}
              
              {business.email && (
                <View style={styles.infoItem}>
                  <Ionicons name="mail-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{business.email}</Text>
                </View>
              )}
              
              {business.website && (
                <View style={styles.infoItem}>
                  <Ionicons name="globe-outline" size={18} color="#666" />
                  <Text style={styles.infoLabel}>Website:</Text>
                  <Text style={styles.infoValue}>{business.website}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <View>
            {/* Review Stats */}
            {reviewStats && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Review Statistics</Text>
                
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{reviewStats.totalReviews}</Text>
                    <Text style={styles.statLabel}>Total Reviews</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{reviewStats.averageRating.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Average Rating</Text>
                  </View>
                </View>
                
                {/* Rating Distribution */}
                <View style={styles.ratingDistribution}>
                  <Text style={styles.distributionTitle}>Rating Distribution</Text>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <View key={rating} style={styles.distributionRow}>
                      <Text style={styles.distributionLabel}>{rating} stars</Text>
                      <View style={styles.distributionBarContainer}>
                        <View 
                          style={[
                            styles.distributionBar, 
                            { 
                              width: `${reviewStats.totalReviews > 0 
                                ? (reviewStats.ratingDistribution[rating] / reviewStats.totalReviews) * 100 
                                : 0}%` 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={styles.distributionCount}>
                        {reviewStats.ratingDistribution[rating]}
                      </Text>
                    </View>
                  ))}
                </View>
                
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => navigation.navigate('ReviewsList', { businessId: business.id })}
                >
                  <Text style={styles.viewAllButtonText}>View All Reviews</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && (
          <View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Deals Management</Text>
              
              {business.status === BUSINESS_STATUS.APPROVED ? (
                <TouchableOpacity
                  style={styles.createDealButton}
                  onPress={handleCreateDeal}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.createDealButtonText}>Create New Deal</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.noteContainer}>
                  <Ionicons name="information-circle-outline" size={24} color="#ffc107" />
                  <Text style={styles.noteText}>
                    You can create deals once your business is approved.
                  </Text>
                </View>
              )}
              
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('DealsList', { businessId: business.id })}
              >
                <Text style={styles.viewAllButtonText}>View All Deals</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  errorButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusBanner: {
    padding: 10,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rejectionText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
  },
  imageContainer: {
    height: 200,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -40,
    left: 20,
    width: 80,
    height: 80,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    backgroundColor: '#fff',
    padding: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  businessHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 10,
  },
  categoryText: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
    marginRight: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007bff',
  },
  tabContent: {
    backgroundColor: '#fff',
    minHeight: 300,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  descriptionContainer: {
    marginTop: 8,
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 8,
    padding: 16,
    marginRight: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  ratingDistribution: {
    marginBottom: 20,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabel: {
    width: 60,
    fontSize: 14,
    color: '#666',
  },
  distributionBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#e1e1e1',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 5,
  },
  distributionCount: {
    width: 30,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
  },
  viewAllButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '500',
  },
  createDealButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 4,
    marginBottom: 16,
  },
  createDealButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9e6',
    padding: 12,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginBottom: 16,
  },
  noteText: {
    color: '#856404',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default BusinessDetailsScreen;