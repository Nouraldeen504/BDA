import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchBusinesses, getBusinessCategories } from '../../api/businessService';

const { width } = Dimensions.get('window');

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    categoryId: null,
    location: '',
    sortBy: 'created_at_desc',
  });
  const [activeSort, setActiveSort] = useState('created_at_desc');
  const [error, setError] = useState(null);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Perform search when search button is pressed or filters change
  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchBusinesses(searchQuery, filters);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const categoriesData = await getBusinessCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Apply filters and close the modal
  const applyFilters = () => {
    setIsFiltersVisible(false);
    handleSearch();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      categoryId: null,
      location: '',
      sortBy: 'created_at_desc',
    });
    setActiveSort('created_at_desc');
  };

  // Set active sort
  const handleSortChange = (sortValue) => {
    setFilters({
      ...filters,
      sortBy: sortValue,
    });
    setActiveSort(sortValue);
  };

  // Render business item
  const renderBusinessItem = ({ item }) => (
    <TouchableOpacity
      style={styles.businessItem}
      onPress={() => navigation.navigate('BusinessDetail', { id: item.id, name: item.name })}
    >
      <Image
        source={item.logo_url ? { uri: item.logo_url } : require('../../../assets/images/business-placeholder.png')}
        style={styles.businessImage}
        resizeMode="cover"
      />
      <View style={styles.businessDetails}>
        <Text style={styles.businessName}>{item.name}</Text>
        <Text style={styles.businessCategory}>{item.categories?.name || 'Business'}</Text>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={styles.ratingText}>
            {item.averageRating ? item.averageRating.toFixed(1) : 'New'} 
            {item.totalReviews > 0 ? ` (${item.totalReviews})` : ''}
          </Text>
        </View>
        {item.address && (
          <View style={styles.addressContainer}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.addressText} numberOfLines={1}>{item.address}</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#aaa" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search businesses, categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Ionicons name="search" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filters row */}
      <View style={styles.filtersRow}>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setIsFiltersVisible(true)}
        >
          <Ionicons name="options-outline" size={20} color="#007bff" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
        
        {filters.categoryId && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>
              {categories.find(c => c.id === filters.categoryId)?.name}
            </Text>
            <TouchableOpacity 
              onPress={() => {
                setFilters({...filters, categoryId: null});
                handleSearch();
              }}
            >
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}
        
        {filters.location && (
          <View style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>{filters.location}</Text>
            <TouchableOpacity 
              onPress={() => {
                setFilters({...filters, location: ''});
                handleSearch();
              }}
            >
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Results list */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : results.length > 0 ? (
        <FlatList
          data={results}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={() => (
            <Text style={styles.resultsCount}>{results.length} business{results.length !== 1 ? 'es' : ''} found</Text>
          )}
        />
      ) : searchQuery !== '' ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={60} color="#ccc" />
          <Text style={styles.noResultsText}>No businesses found</Text>
          <Text style={styles.noResultsSubText}>Try different keywords or filters</Text>
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <Ionicons name="search" size={60} color="#ccc" />
          <Text style={styles.initialText}>Search for local businesses</Text>
          <Text style={styles.initialSubText}>Find businesses by name, category, or location</Text>
        </View>
      )}

      {/* Filters modal */}
      <Modal
        visible={isFiltersVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFiltersVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setIsFiltersVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Category filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Category</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesContainer}
                >
                  <TouchableOpacity 
                    style={[
                      styles.categoryChip,
                      !filters.categoryId && styles.categoryChipActive
                    ]}
                    onPress={() => setFilters({...filters, categoryId: null})}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      !filters.categoryId && styles.categoryChipTextActive
                    ]}>All</Text>
                  </TouchableOpacity>
                  
                  {categories.map((category) => (
                    <TouchableOpacity 
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        filters.categoryId === category.id && styles.categoryChipActive
                      ]}
                      onPress={() => setFilters({...filters, categoryId: category.id})}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        filters.categoryId === category.id && styles.categoryChipTextActive
                      ]}>{category.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              {/* Location filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Location</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="Enter city, area, etc."
                  value={filters.location}
                  onChangeText={(text) => setFilters({...filters, location: text})}
                />
              </View>
              
              {/* Sort options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sort By</Text>
                <TouchableOpacity 
                  style={[
                    styles.sortOption,
                    activeSort === 'created_at_desc' && styles.sortOptionActive
                  ]}
                  onPress={() => handleSortChange('created_at_desc')}
                >
                  <Text style={styles.sortOptionText}>Newest First</Text>
                  {activeSort === 'created_at_desc' && (
                    <Ionicons name="checkmark" size={18} color="#007bff" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.sortOption,
                    activeSort === 'name_asc' && styles.sortOptionActive
                  ]}
                  onPress={() => handleSortChange('name_asc')}
                >
                  <Text style={styles.sortOptionText}>Name (A-Z)</Text>
                  {activeSort === 'name_asc' && (
                    <Ionicons name="checkmark" size={18} color="#007bff" />
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.sortOption,
                    activeSort === 'name_desc' && styles.sortOptionActive
                  ]}
                  onPress={() => handleSortChange('name_desc')}
                >
                  <Text style={styles.sortOptionText}>Name (Z-A)</Text>
                  {activeSort === 'name_desc' && (
                    <Ionicons name="checkmark" size={18} color="#007bff" />
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  searchButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filtersRow: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    flexWrap: 'wrap',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  filterButtonText: {
    color: '#007bff',
    fontSize: 14,
    marginLeft: 4,
  },
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f2ff',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  activeFilterText: {
    color: '#333',
    fontSize: 14,
    marginRight: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  businessItem: {
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
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  businessDetails: {
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
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
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
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  noResultsSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  initialText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  initialSubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalScrollView: {
    maxHeight: '60%',
  },
  filterSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  categoryChipActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryChipText: {
    color: '#333',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  filterInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sortOptionActive: {
    backgroundColor: '#f0f7ff',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e1e1',
  },
  resetButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resetButtonText: {
    color: '#666',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchScreen;