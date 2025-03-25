import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/adminService';

const CategoryManagementScreen = ({ navigation }) => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState(null);
  const [showParentSelection, setShowParentSelection] = useState(false);
  
  // Delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const categoriesData = await getCategories();
      setCategories(categoriesData);
      setFilteredCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = categories.filter(
        category => category.name.toLowerCase().includes(query)
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchCategories();
  };

  // Reset modal state
  const resetModalState = () => {
    setIsEditing(false);
    setSelectedCategory(null);
    setCategoryName('');
    setCategoryDescription('');
    setParentCategoryId(null);
    setShowParentSelection(false);
  };

  // Show add category modal
  const handleAddCategory = () => {
    resetModalState();
    setModalVisible(true);
  };

  // Show edit category modal
  const handleEditCategory = (category) => {
    setIsEditing(true);
    setSelectedCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setParentCategoryId(category.parent_id);
    setModalVisible(true);
  };

  // Show delete confirmation modal
  const handleDeleteConfirmation = (category) => {
    setSelectedCategory(category);
    setDeleteModalVisible(true);
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    setDeleteModalVisible(false);
    setIsLoading(true);
    
    try {
      await deleteCategory(selectedCategory.id);
      
      // Update local state
      const updatedCategories = categories.filter(c => c.id !== selectedCategory.id);
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);
      
      Alert.alert('Success', `Category "${selectedCategory.name}" has been deleted.`);
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('Error', `Failed to delete category: ${error.message}`);
    } finally {
      setIsLoading(false);
      setSelectedCategory(null);
    }
  };

  // Toggle parent category selection
  const handleToggleParentSelection = () => {
    setShowParentSelection(!showParentSelection);
  };

  // Select parent category
  const handleSelectParent = (category) => {
    setParentCategoryId(category.id);
    setShowParentSelection(false);
  };

  // Clear parent category
  const handleClearParent = () => {
    setParentCategoryId(null);
  };

  // Save category (create or update)
  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Required', 'Category name is required.');
      return;
    }
    
    setModalVisible(false);
    setIsLoading(true);
    
    try {
      if (isEditing) {
        // Update existing category
        const updatedCategory = await updateCategory(selectedCategory.id, {
          name: categoryName.trim(),
          description: categoryDescription.trim() || null,
          parent_id: parentCategoryId,
        });
        
        // Update local state
        const updatedCategories = categories.map(c => 
          c.id === updatedCategory.id ? updatedCategory : c
        );
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        
        Alert.alert('Success', `Category "${categoryName}" has been updated.`);
      } else {
        // Create new category
        const newCategory = await createCategory(
          categoryName.trim(),
          categoryDescription.trim() || null,
          parentCategoryId
        );
        
        // Update local state
        const updatedCategories = [...categories, newCategory];
        setCategories(updatedCategories);
        setFilteredCategories(updatedCategories);
        
        Alert.alert('Success', `Category "${categoryName}" has been created.`);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} category.`);
    } finally {
      setIsLoading(false);
      resetModalState();
    }
  };

  // Get parent category name
  const getParentCategoryName = (parentId) => {
    if (!parentId) return null;
    const parent = categories.find(c => c.id === parentId);
    return parent ? parent.name : null;
  };

  // Get subcategories for a category
  const getSubcategories = (categoryId) => {
    return categories.filter(c => c.parent_id === categoryId);
  };

  // Check if category has subcategories
  const hasSubcategories = (categoryId) => {
    return categories.some(c => c.parent_id === categoryId);
  };

  // Render category item
  const renderCategoryItem = ({ item }) => {
    const subcategories = getSubcategories(item.id);
    const hasChildren = subcategories.length > 0;
    
    return (
      <View style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View>
            <Text style={styles.categoryName}>{item.name}</Text>
            {item.parent_id && (
              <Text style={styles.parentCategory}>
                Parent: {getParentCategoryName(item.parent_id)}
              </Text>
            )}
          </View>
          <Text style={styles.businessCount}>
            {hasChildren ? `${subcategories.length} subcategories` : 'No subcategories'}
          </Text>
        </View>
        
        {item.description && (
          <Text style={styles.categoryDescription}>{item.description}</Text>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditCategory(item)}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.deleteButton, hasChildren && styles.disabledButton]}
            onPress={() => !hasChildren && handleDeleteConfirmation(item)}
            disabled={hasChildren}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render parent category selection item
  const renderParentCategoryItem = ({ item }) => {
    // Don't show the currently editing category or its children as potential parents
    if (isEditing && (item.id === selectedCategory.id || item.parent_id === selectedCategory.id)) {
      return null;
    }
    
    return (
      <TouchableOpacity
        style={[
          styles.parentCategoryItem,
          parentCategoryId === item.id && styles.selectedParentItem
        ]}
        onPress={() => handleSelectParent(item)}
      >
        <Text style={styles.parentCategoryItemText}>{item.name}</Text>
        {parentCategoryId === item.id && (
          <Ionicons name="checkmark" size={18} color="#007bff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search and Add */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCategory}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Categories List */}
      {isLoading && categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : filteredCategories.length > 0 ? (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={() => (
            <Text style={styles.resultCount}>
              {filteredCategories.length} {filteredCategories.length === 1 ? 'category' : 'categories'} found
            </Text>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Categories Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first category to get started.'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={handleAddCategory}
            >
              <Text style={styles.emptyAddButtonText}>Add Category</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Category Edit/Add Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Category' : 'Add Category'}
            </Text>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Category Name *</Text>
              <TextInput
                style={styles.modalInput}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Enter category name"
              />
            </View>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={categoryDescription}
                onChangeText={setCategoryDescription}
                placeholder="Enter category description"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.modalInputContainer}>
              <Text style={styles.modalLabel}>Parent Category (Optional)</Text>
              
              {!showParentSelection ? (
                <TouchableOpacity
                  style={styles.parentSelectorButton}
                  onPress={handleToggleParentSelection}
                >
                  <Text style={styles.parentSelectorText}>
                    {parentCategoryId
                      ? getParentCategoryName(parentCategoryId)
                      : 'Select a parent category (if any)'}
                  </Text>
                  {parentCategoryId ? (
                    <TouchableOpacity
                      style={styles.clearParentButton}
                      onPress={handleClearParent}
                    >
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  )}
                </TouchableOpacity>
              ) : (
                <View style={styles.parentSelectionContainer}>
                  <TouchableOpacity
                    style={styles.closeSelectorButton}
                    onPress={handleToggleParentSelection}
                  >
                    <Ionicons name="chevron-up" size={20} color="#666" />
                    <Text style={styles.closeSelectorText}>Close</Text>
                  </TouchableOpacity>
                  
                  <FlatList
                    data={categories}
                    renderItem={renderParentCategoryItem}
                    keyExtractor={(item) => item.id}
                    style={styles.parentCategoryList}
                    ListHeaderComponent={() => (
                      <TouchableOpacity
                        style={[
                          styles.parentCategoryItem,
                          parentCategoryId === null && styles.selectedParentItem
                        ]}
                        onPress={() => handleSelectParent({ id: null })}
                      >
                        <Text style={styles.parentCategoryItemText}>None (Top-level category)</Text>
                        {parentCategoryId === null && (
                          <Ionicons name="checkmark" size={18} color="#007bff" />
                        )}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveCategory}
              >
                <Text style={styles.modalSaveText}>
                  {isEditing ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Category</Text>
            
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete the category "{selectedCategory?.name}"?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={handleDeleteCategory}
              >
                <Text style={styles.deleteConfirmText}>Delete</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  categoryCard: {
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
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  parentCategory: {
    fontSize: 12,
    color: '#666',
  },
  businessCount: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    marginLeft: 4,
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
    marginBottom: 20,
  },
  emptyAddButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#dc3545',
  },
  deleteModalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  modalInputContainer: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  parentSelectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  parentSelectorText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  clearParentButton: {
    padding: 4,
  },
  parentSelectionContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 200,
  },
  closeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeSelectorText: {
    marginLeft: 4,
    color: '#666',
  },
  parentCategoryList: {
    maxHeight: 150,
  },
  parentCategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedParentItem: {
    backgroundColor: '#e6f2ff',
  },
  parentCategoryItemText: {
    fontSize: 16,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  modalSaveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: '500',
  },
  deleteConfirmButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  deleteConfirmText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default CategoryManagementScreen;