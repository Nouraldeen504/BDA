import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBusinessVerificationRequests, updateBusinessStatus } from '../../api/adminService';
import { BUSINESS_STATUS } from '../../api/businessService';

const BusinessVerificationScreen = ({ navigation }) => {
  const [businesses, setBusinesses] = useState([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState(BUSINESS_STATUS.PENDING);

  // Load businesses on mount
  useEffect(() => {
    fetchBusinesses();
  }, [statusFilter]);

  // Fetch businesses
  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const businessRequests = await getBusinessVerificationRequests(statusFilter);
      console.log('Status Filter:', statusFilter);
      console.log('Business Requests:', businessRequests);
      setBusinesses(businessRequests);
      setFilteredBusinesses(businessRequests);
    } catch (error) {
      console.error('Error fetching business verification requests:', error);
      Alert.alert('Error', 'Failed to load business verification requests.');
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

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBusinesses(businesses);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = businesses.filter(
        business => 
          business.name.toLowerCase().includes(query) ||
          business.profiles?.display_name.toLowerCase().includes(query) ||
          business.profiles?.email.toLowerCase().includes(query)
      );
      setFilteredBusinesses(filtered);
    }
  }, [searchQuery, businesses]);

  // Show business details
  const handleViewDetails = (business) => {
    navigation.navigate('BusinessDetails', { 
      businessId: business.id,
      name: business.name
    });
  };

  // Show approval confirmation
  const handleApproveConfirmation = (business) => {
    Alert.alert(
      'Approve Business',
      `Are you sure you want to approve "${business.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Approve',
          onPress: () => handleApprove(business)
        }
      ]
    );
  };

  // Approve business
  const handleApprove = async (business) => {
    setIsLoading(true);
    try {
      await updateBusinessStatus(business.id, BUSINESS_STATUS.APPROVED);
      
      // Update local state
      if (statusFilter === BUSINESS_STATUS.PENDING) {
        const updatedBusinesses = businesses.filter(b => b.id !== business.id);
        setBusinesses(updatedBusinesses);
        setFilteredBusinesses(updatedBusinesses);
      } else {
        // If not filtering by pending, fetch all again
        fetchBusinesses();
      }
      
      Alert.alert('Success', `"${business.name}" has been approved.`);
    } catch (error) {
      console.error('Error approving business:', error);
      Alert.alert('Error', 'Failed to approve business.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show rejection modal
  const handleShowRejectionModal = (business) => {
    setSelectedBusiness(business);
    setRejectionReason('');
    setModalVisible(true);
  };

  // Reject business
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }
    
    setModalVisible(false);
    setIsLoading(true);
    
    try {
      await updateBusinessStatus(
        selectedBusiness.id, 
        BUSINESS_STATUS.REJECTED, 
        rejectionReason
      );
      
      // Update local state
      if (statusFilter === BUSINESS_STATUS.PENDING) {
        const updatedBusinesses = businesses.filter(b => b.id !== selectedBusiness.id);
        setBusinesses(updatedBusinesses);
        setFilteredBusinesses(updatedBusinesses);
      } else {
        // If not filtering by pending, fetch all again
        fetchBusinesses();
      }
      
      Alert.alert('Success', `"${selectedBusiness.name}" has been rejected.`);
    } catch (error) {
      console.error('Error rejecting business:', error);
      Alert.alert('Error', 'Failed to reject business.');
    } finally {
      setIsLoading(false);
      setSelectedBusiness(null);
    }
  };

  // Toggle status filter
  const handleFilterChange = (status) => {
    setStatusFilter(status);
  };

  // Render business item
  const renderBusinessItem = ({ item }) => (
    <View style={styles.businessCard}>
      <View style={styles.businessHeader}>
        <Image
          source={
            item.logo_url
              ? { uri: item.logo_url }
              : require('../../../assets/images/business-placeholder.png')
          }
          style={styles.businessLogo}
          resizeMode="cover"
        />
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{item.name}</Text>
          <Text style={styles.businessCategory}>{item.categories?.name || 'Uncategorized'}</Text>
          <Text style={styles.businessOwner}>
            Owner: {item.profiles?.display_name || item.profiles?.email || 'Unknown'}
          </Text>
          <Text style={styles.businessDate}>
            Submitted: {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewDetails(item)}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>View</Text>
        </TouchableOpacity>
        
        {statusFilter === BUSINESS_STATUS.PENDING && (
          <>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleApproveConfirmation(item)}
            >
              <Ionicons name="checkmark-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Approve</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleShowRejectionModal(item)}
            >
              <Ionicons name="close-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and filter */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search businesses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === BUSINESS_STATUS.PENDING && styles.activeFilterButton
            ]}
            onPress={() => handleFilterChange(BUSINESS_STATUS.PENDING)}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === BUSINESS_STATUS.PENDING && styles.activeFilterText
            ]}>
              Pending
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === BUSINESS_STATUS.APPROVED && styles.activeFilterButton
            ]}
            onPress={() => handleFilterChange(BUSINESS_STATUS.APPROVED)}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === BUSINESS_STATUS.APPROVED && styles.activeFilterText
            ]}>
              Approved
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.filterButton,
              statusFilter === BUSINESS_STATUS.REJECTED && styles.activeFilterButton
            ]}
            onPress={() => handleFilterChange(BUSINESS_STATUS.REJECTED)}
          >
            <Text style={[
              styles.filterButtonText,
              statusFilter === BUSINESS_STATUS.REJECTED && styles.activeFilterText
            ]}>
              Rejected
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Business list */}
      {isLoading && businesses.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : filteredBusinesses.length > 0 ? (
        <FlatList
          data={filteredBusinesses}
          renderItem={renderBusinessItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListHeaderComponent={() => (
            <Text style={styles.resultCount}>
              {filteredBusinesses.length} {filteredBusinesses.length === 1 ? 'business' : 'businesses'} found
            </Text>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Businesses Found</Text>
          <Text style={styles.emptyText}>
            {statusFilter === BUSINESS_STATUS.PENDING
              ? 'There are no pending business verification requests.'
              : statusFilter === BUSINESS_STATUS.APPROVED
              ? 'There are no approved businesses.'
              : 'There are no rejected businesses.'}
          </Text>
        </View>
      )}

      {/* Rejection reason modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Reason</Text>
            
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting "{selectedBusiness?.name}":
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason for rejection"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleReject}
              >
                <Text style={styles.modalConfirmText}>Confirm Rejection</Text>
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
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
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
  businessCard: {
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
  businessHeader: {
    flexDirection: 'row',
    marginBottom: 16,
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
  businessOwner: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  businessDate: {
    fontSize: 12,
    color: '#888',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  modalConfirmButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default BusinessVerificationScreen;