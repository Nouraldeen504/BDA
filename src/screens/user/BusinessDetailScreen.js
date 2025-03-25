import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  getBusinessById, 
  addBusinessToBookmarks, 
  removeBusinessFromBookmarks,
  isBusinessBookmarked 
} from '../../api/businessService';
import { getBusinessReviews, getBusinessReviewStats } from '../../api/reviewService';
import { getBusinessDeals } from '../../api/dealService';

const { width } = Dimensions.get('window');
const tabWidth = width / 3;

const BusinessDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [error, setError] = useState(null);
  
  const scrollViewRef = useRef(null);

  // Check if active tab is specified in navigation params
  useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params]);

  // Load business data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        setError(null);
        setIsLoading(true);
        
        try {
          // Fetch business details
          const businessData = await getBusinessById(id);
          setBusiness(businessData);
          
          // Fetch reviews
          const reviewsData = await getBusinessReviews(id);
          setReviews(reviewsData);
          
          // Fetch review stats
          const statsData = await getBusinessReviewStats(id);
          setReviewStats(statsData);
          
          // Fetch deals
          const dealsData = await getBusinessDeals(id);
          setDeals(dealsData);
          
          // Check bookmark status
          const bookmarkStatus = await isBusinessBookmarked(id);
          setIsBookmarked(bookmarkStatus);
        } catch (error) {
          console.error('Error fetching business details:', error);
          setError('Failed to load business details. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
      
      return () => {
        // Cleanup if needed
      };
    }, [id])
  );

  // Handle toggling bookmarks
  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await removeBusinessFromBookmarks(id);
      } else {
        await addBusinessToBookmarks(id);
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Share business information
  const handleShare = async () => {
    if (!business) return;

    try {
      await Share.share({
        message: `Check out ${business.name} on Local Business Directory!\n\n${business.description || ''}`,
        title: business.name,
      });
    } catch (error) {
      console.error('Error sharing business:', error);
    }
  };

  // Open navigation/maps app
  const handleGetDirections = () => {
    if (!business || !business.address) return;

    const address = encodeURIComponent(business.address);
    const url = `https://www.google.com/maps/search/?api=1&query=${address}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          console.error('Cannot open URL:', url);
        }
      })
      .catch((error) => console.error('Error opening maps:', error));
  };

  // Make a phone call
  const handleCall = () => {
    if (!business || !business.phone) return;

    const phoneUrl = `tel:${business.phone}`;
    Linking.canOpenURL(phoneUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneUrl);
        } else {
          console.error('Cannot open URL:', phoneUrl);
        }
      })
      .catch((error) => console.error('Error initiating call:', error));
  };

  // Open website
  const handleOpenWebsite = () => {
    if (!business || !business.website) return;

    let website = business.website;
    if (!website.startsWith('http://') && !website.startsWith('https://')) {
      website = `https://${website}`;
    }

    Linking.canOpenURL(website)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(website);
        } else {
          console.error('Cannot open URL:', website);
        }
      })
      .catch((error) => console.error('Error opening website:', error));
  };

  // Render review item
  const renderReviewItem = (review) => (
    <View key={review.id} style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUser}>
          <Image
            source={
              review.profiles.avatar_url
                ? { uri: review.profiles.avatar_url }
                : require('../../../assets/images/avatar-placeholder.png')
            }
            style={styles.reviewAvatar}
          />
          <Text style={styles.reviewUserName}>{review.profiles.display_name}</Text>
        </View>
        <View style={styles.reviewRating}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= review.rating ? 'star' : 'star-outline'}
              size={16}
              color="#FFD700"
            />
          ))}
        </View>
      </View>
      <Text style={styles.reviewDate}>
        {new Date(review.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.reviewComment}>{review.comment}</Text>
      {review.photos && review.photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewPhotos}>
          {review.photos.map((photo, index) => (
            <Image key={index} source={{ uri: photo }} style={styles.reviewPhoto} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  // Render deal item
  const renderDealItem = (deal) => (
    <View key={deal.id} style={styles.dealItem}>
      <View style={styles.dealHeader}>
        <View>
          <Text style={styles.dealTitle}>{deal.title}</Text>
          <Text style={styles.dealDates}>
            Valid: {new Date(deal.start_date).toLocaleDateString()} - {new Date(deal.end_date).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.dealDiscount}>
          <Text style={styles.dealDiscountText}>{deal.discount_value}% OFF</Text>
        </View>
      </View>
      <Text style={styles.dealDescription}>{deal.description}</Text>
      {deal.conditions && (
        <Text style={styles.dealConditions}>Conditions: {deal.conditions}</Text>
      )}
    </View>
  );

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
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

  // If business not found
  if (!business) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="business-outline" size={60} color="#ccc" />
        <Text style={styles.errorText}>Business not found</Text>
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
    <View style={styles.container}>
      {/* Header image */}
      <ScrollView ref={scrollViewRef}>
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

        {/* Business info and actions */}
        <View style={styles.businessHeader}>
          <Text style={styles.businessName}>{business.name}</Text>
          
          <View style={styles.categoryRow}>
            <View style={styles.category}>
              <Text style={styles.categoryText}>{business.categories?.name || 'Business'}</Text>
            </View>
            
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {business.averageRating ? business.averageRating.toFixed(1) : 'New'} 
                {business.totalReviews > 0 && ` (${business.totalReviews})`}
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Ionicons name="call" size={22} color="#007bff" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleGetDirections}>
              <Ionicons name="navigate" size={22} color="#007bff" />
              <Text style={styles.actionText}>Directions</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleToggleBookmark}>
              <Ionicons 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={22} 
                color="#007bff" 
              />
              <Text style={styles.actionText}>Bookmark</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color="#007bff" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab navigation */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.activeTab]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
              Info
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => setActiveTab('reviews')}
          >
            <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
              Reviews ({business.totalReviews || 0})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'deals' && styles.activeTab]}
            onPress={() => setActiveTab('deals')}
          >
            <Text style={[styles.tabText, activeTab === 'deals' && styles.activeTabText]}>
              Deals ({deals.length || 0})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab content */}
        <View style={styles.tabContent}>
          {/* Info tab */}
          {activeTab === 'info' && (
            <View>
              {business.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.description}>{business.description}</Text>
                </View>
              )}
              
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                
                {business.address && (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>{business.address}</Text>
                  </View>
                )}
                
                {business.phone && (
                  <TouchableOpacity style={styles.infoRow} onPress={handleCall}>
                    <Ionicons name="call-outline" size={20} color="#666" />
                    <Text style={styles.infoTextLink}>{business.phone}</Text>
                  </TouchableOpacity>
                )}
                
                {business.email && (
                  <TouchableOpacity 
                    style={styles.infoRow} 
                    onPress={() => Linking.openURL(`mailto:${business.email}`)}
                  >
                    <Ionicons name="mail-outline" size={20} color="#666" />
                    <Text style={styles.infoTextLink}>{business.email}</Text>
                  </TouchableOpacity>
                )}
                
                {business.website && (
                  <TouchableOpacity style={styles.infoRow} onPress={handleOpenWebsite}>
                    <Ionicons name="globe-outline" size={20} color="#666" />
                    <Text style={styles.infoTextLink} numberOfLines={1}>
                      {business.website}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {business.hours && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Business Hours</Text>
                  {Object.entries(business.hours).map(([day, hours]) => (
                    <View key={day} style={styles.hoursRow}>
                      <Text style={styles.dayText}>{day}</Text>
                      <Text style={styles.hoursText}>{hours}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Reviews tab */}
          {activeTab === 'reviews' && (
            <View>
              {/* Review summary */}
              {reviewStats && (
                <View style={styles.reviewSummary}>
                  <View style={styles.reviewAverageContainer}>
                    <Text style={styles.reviewAverageText}>
                      {reviewStats.averageRating.toFixed(1)}
                    </Text>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= Math.round(reviewStats.averageRating) ? 'star' : 'star-outline'}
                          size={16}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewCountText}>
                      {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
                    </Text>
                  </View>
                  
                  <View style={styles.reviewDistribution}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <View key={rating} style={styles.reviewBar}>
                        <Text style={styles.reviewBarLabel}>{rating}</Text>
                        <View style={styles.reviewBarBackground}>
                          <View 
                            style={[
                              styles.reviewBarFill, 
                              { 
                                width: `${reviewStats.totalReviews > 0 
                                  ? (reviewStats.ratingDistribution[rating] / reviewStats.totalReviews) * 100 
                                  : 0}%` 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={styles.reviewBarCount}>{reviewStats.ratingDistribution[rating]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Write review button */}
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => navigation.navigate('Review', { businessId: id, businessName: business.name })}
              >
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.writeReviewText}>Write a Review</Text>
              </TouchableOpacity>

              {/* Reviews list */}
              <View style={styles.reviewsList}>
                {reviews.length > 0 ? (
                  reviews.map((review) => renderReviewItem(review))
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
                    <Text style={styles.emptyStateText}>No reviews yet</Text>
                    <Text style={styles.emptyStateSubText}>Be the first to review this business</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Deals tab */}
          {activeTab === 'deals' && (
            <View>
              {deals.length > 0 ? (
                <View style={styles.dealsList}>
                  {deals.map((deal) => renderDealItem(deal))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="pricetag-outline" size={40} color="#ccc" />
                  <Text style={styles.emptyStateText}>No active deals</Text>
                  <Text style={styles.emptyStateSubText}>Check back later for special offers</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
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
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
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
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#007bff',
    marginTop: 4,
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginLeft: 10,
    flex: 1,
  },
  infoTextLink: {
    fontSize: 16,
    color: '#007bff',
    marginLeft: 10,
    flex: 1,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingVertical: 4,
  },
  dayText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    width: 100,
  },
  hoursText: {
    fontSize: 16,
    color: '#555',
  },
  reviewSummary: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  reviewAverageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  reviewAverageText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewStars: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  reviewCountText: {
    fontSize: 14,
    color: '#666',
  },
  reviewDistribution: {
    flex: 1,
    paddingLeft: 20,
  },
  reviewBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewBarLabel: {
    width: 15,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  reviewBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#e1e1e1',
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  reviewBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
  },
  reviewBarCount: {
    width: 20,
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  writeReviewButton: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 12,
    borderRadius: 8,
  },
  writeReviewText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  reviewsList: {
    padding: 20,
    paddingTop: 0,
  },
  reviewItem: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    color: '#888',
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  reviewPhotos: {
    marginTop: 12,
  },
  reviewPhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  dealsList: {
    padding: 20,
  },
  dealItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dealDates: {
    fontSize: 12,
    color: '#888',
  },
  dealDiscount: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  dealDiscountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  dealDescription: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  dealConditions: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BusinessDetailScreen;