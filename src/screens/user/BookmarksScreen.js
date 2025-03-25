import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getBookmarkedBusinesses, removeBusinessFromBookmarks } from '../../api/businessService';

const BookmarksScreen = ({ navigation }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load bookmarks when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchBookmarks();
      return () => {};
    }, [])
  );

  // Fetch bookmarked businesses
  const fetchBookmarks = async () => {
    setError(null);
    
    try {
      const bookmarkedBusinesses = await getBookmarkedBusinesses();
      setBookmarks(bookmarkedBusinesses);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setError('Failed to load your bookmarks. Please try again later.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookmarks();
  };

  // Remove bookmark
  const handleRemoveBookmark = (businessId, businessName) => {
    Alert.alert(
      'Remove Bookmark',
      `Are you sure you want to remove ${businessName} from your bookmarks?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              await removeBusinessFromBookmarks(businessId);
              setBookmarks(bookmarks.filter(bookmark => bookmark.id !== businessId));
            } catch (error) {
              console.error('Error removing bookmark:', error);
              Alert.alert('Error', 'Failed to remove bookmark. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  // Render bookmark item
  const renderBookmarkItem = ({ item }) => (
    <TouchableOpacity
      style={styles.bookmarkItem}
      onPress={() => navigation.navigate('BusinessDetail', { id: item.id, name: item.name })}
    >
      <Image
        source={item.logo_url ? { uri: item.logo_url } : require('../../../assets/images/business-placeholder.png')}
        style={styles.businessImage}
        resizeMode="cover"
      />
      <View style={styles.businessInfo}>
        <Text style={styles.businessName}>{item.name}</Text>
        <Text style={styles.businessCategory}>{item.categories?.name || 'Business'}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.averageRating ? item.averageRating.toFixed(1) : 'New'} 
            {item.totalReviews > 0 && ` (${item.totalReviews})`}
          </Text>
        </View>
        <Text style={styles.bookmarkDate}>
          Bookmarked on {new Date(item.bookmarkedAt).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveBookmark(item.id, item.name)}
      >
        <Ionicons name="bookmark-remove-outline" size={24} color="#f44336" />
      </TouchableOpacity>
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
      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Bookmarks list */}
      {bookmarks.length > 0 ? (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Bookmarks Yet</Text>
          <Text style={styles.emptyText}>
            Bookmark your favorite businesses to quickly access them later.
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
  bookmarkItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
  },
  businessImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  bookmarkDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 8,
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

export default BookmarksScreen;