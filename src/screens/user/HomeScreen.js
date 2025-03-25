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
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAllBusinesses } from '../../api/businessService';
import { getFeaturedDeals } from '../../api/dealService';

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

const HomeScreen = ({ navigation }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [recentBusinesses, setRecentBusinesses] = useState([]);
  const [featuredDeals, setFeaturedDeals] = useState([]);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Fetch all required data
  const fetchData = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Get all businesses
      const allBusinesses = await getAllBusinesses();
      
      // Filter featured businesses
      const featured = allBusinesses.filter(business => business.is_featured)
        .sort((a, b) => a.featured_order - b.featured_order);
      setFeaturedBusinesses(featured);
      
      // Get recent businesses
      const recent = [...allBusinesses]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      setRecentBusinesses(recent);
      
      // Get featured deals
      const deals = await getFeaturedDeals(10);
      setFeaturedDeals(deals);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError('Failed to load data. Pull down to refresh.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Render business card
  const renderBusinessCard = ({ item }) => (
    <TouchableOpacity
      style={styles.businessCard}
      onPress={() => navigation.navigate('BusinessDetail', { id: item.id, name: item.name })}
    >
      <Image
        source={item.logo_url ? { uri: item.logo_url } : require('../../../assets/images/business-placeholder.png')}
        style={styles.businessLogo}
        resizeMode="cover"
      />
      <View style={styles.businessInfo}>
        <Text style={styles.businessName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.businessCategory} numberOfLines={1}>
          {item.categories?.name || 'Business'}
        </Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.averageRating ? item.averageRating.toFixed(1) : 'New'} 
            {item.totalReviews > 0 && ` (${item.totalReviews})`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render deal card
  const renderDealCard = ({ item }) => (
    <TouchableOpacity
      style={styles.dealCard}
      onPress={() => navigation.navigate('BusinessDetail', { 
        id: item.businesses.id,
        name: item.businesses.name,
        activeTab: 'deals'
      })}
    >
      <View style={styles.dealDiscountBadge}>
        <Text style={styles.discountText}>{item.discount_value}% OFF</Text>
      </View>
      <View style={styles.dealContent}>
        <Text style={styles.dealTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.dealBusiness} numberOfLines={1}>
          {item.businesses.name}
        </Text>
        <Text style={styles.dealDates} numberOfLines={1}>
          Valid until {new Date(item.end_date).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Show loading indicator if loading
  if (loading) {
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
      {/* Welcome message */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back, {profile?.display_name || 'User'}</Text>
        <Text style={styles.welcomeSubtext}>Discover local businesses near you</Text>
      </View>

      {/* Error message if applicable */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Search bar (non-functional in this component - just UI) */}
      <TouchableOpacity
        style={styles.searchContainer}
        onPress={() => navigation.navigate('SearchTab')}
      >
        <Ionicons name="search" size={20} color="#666" />
        <Text style={styles.searchText}>Search businesses, categories...</Text>
      </TouchableOpacity>

      {/* Featured businesses section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Businesses</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {featuredBusinesses.length > 0 ? (
          <FlatList
            data={featuredBusinesses}
            renderItem={renderBusinessCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        ) : (
          <Text style={styles.emptyText}>No featured businesses available.</Text>
        )}
      </View>

      {/* Featured deals section */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hot Deals</Text>
          <TouchableOpacity onPress={() => navigation.navigate('DealsTab')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {featuredDeals.length > 0 ? (
          <FlatList
            data={featuredDeals}
            renderItem={renderDealCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        ) : (
          <Text style={styles.emptyText}>No active deals available.</Text>
        )}
      </View>

      {/* Recent businesses section */}
      <View style={[styles.sectionContainer, styles.lastSection]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentBusinesses.length > 0 ? (
          <FlatList
            data={recentBusinesses}
            renderItem={renderBusinessCard}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContainer}
          />
        ) : (
          <Text style={styles.emptyText}>No recent businesses available.</Text>
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
  welcomeSection: {
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeSubtext: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  searchText: {
    marginLeft: 8,
    color: '#666',
    flex: 1,
  },
  sectionContainer: {
    marginTop: 16,
  },
  lastSection: {
    marginBottom: 24,
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
    fontWeight: '500',
  },
  horizontalListContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  businessCard: {
    width: cardWidth / 2.2,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 4,
  },
  businessLogo: {
    width: '100%',
    height: 100,
    backgroundColor: '#eee',
  },
  businessInfo: {
    padding: 10,
  },
  businessName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  businessCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  dealCard: {
    width: cardWidth / 1.8,
    height: 140,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  dealDiscountBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    zIndex: 1,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dealContent: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  dealTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    marginTop: 6,
  },
  dealBusiness: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  dealDates: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default HomeScreen;