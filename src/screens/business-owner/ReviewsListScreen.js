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
import { getBusinessReviews } from '../../api/reviewService';

const ReviewsListScreen = ({ navigation, route }) => {
  const { businessId } = route.params || {};
  
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(businessId);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Load businesses on mount
  useEffect(() => {
    fetchBusinesses();
  }, []);
  
  // Load reviews when selected business changes
  useEffect(() => {
    if (selectedBusinessId) {
      fetchReviews(selectedBusinessId);
    } else {
      setReviews([]);
    }
  }, [selectedBusinessId]);
  
  const fetchBusinesses = async () => {
    try {
      const businessesData = await getBusinessesByOwner();
      setBusinesses(businessesData);
      
      // If no business was pre-selected, select the first one
      if (!selectedBusinessId && businessesData.length > 0) {
        setSelectedBusinessId(businessesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchReviews = async (businessId) => {
    setIsLoading(true);
    try {
      const reviewsData = await getBusinessReviews(businessId);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    if (selectedBusinessId) {
      fetchReviews(selectedBusinessId);
    } else {
      fetchBusinesses();
    }
  };
  
  const handleBusinessSelect = (businessId) => {
    setSelectedBusinessId(businessId);
  };
  
  // Render business selector
  const renderBusinessSelector = () => (
    <View style={styles.businessSelectorContainer}>
      <Text style={styles.selectorLabel}>Select Business:</Text>
      <View style={styles.businessesList}>
        {businesses.map((business) => (
          <TouchableOpacity
            key={business.id}
            style={[
              styles.businessChip,
              selectedBusinessId === business.id && styles.selectedBusinessChip
            ]}
            onPress={() => handleBusinessSelect(business.id)}
          >
            <Text
              style={[
                styles.businessChipText,
                selectedBusinessId === business.id && styles.selectedBusinessChipText
              ]}
            >
              {business.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  
  // Render review item
  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          <Image
            source={require('../../../assets/images/avatar-placeholder.png')}
            style={styles.reviewAvatar}
          />
          <Text style={styles.reviewUserName}>{item.profiles?.display_name || 'Anonymous'}</Text>
        </View>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? "star" : "star-outline"}
              size={16}
              color="#FFD700"
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.reviewComment}>{item.comment}</Text>
    </View>
  );
  
  // Show loading indicator
  if (isLoading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {businesses.length > 0 ? (
        <>
          {renderBusinessSelector()}
          
          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={renderReviewItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubble-outline" size={60} color="#ccc" />
              <Text style={styles.emptyTitle}>No Reviews Yet</Text>
              <Text style={styles.emptyText}>
                This business hasn't received any reviews yet.
              </Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Businesses</Text>
          <Text style={styles.emptyText}>
            You don't have any businesses to view reviews for.
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
  businessSelectorContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  businessesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  businessChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedBusinessChip: {
    backgroundColor: '#007bff',
  },
  businessChipText: {
    color: '#333',
  },
  selectedBusinessChipText: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  reviewItem: {
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
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  reviewUserName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
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

export default ReviewsListScreen;