import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getBusinessById, updateBusinessStatus } from '../../api/adminService';
import { BUSINESS_STATUS } from '../../api/businessService';

const BusinessDetailsScreen = ({ route, navigation }) => {
  const { businessId } = route.params;
  
  const [business, setBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  useEffect(() => {
    fetchBusinessDetails();
  }, [businessId]);
  
  const fetchBusinessDetails = async () => {
    try {
      const businessData = await getBusinessById(businessId);
      setBusiness(businessData);
    } catch (error) {
      console.error('Error fetching business details:', error);
      Alert.alert('Error', 'Failed to load business details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApprove = async () => {
    try {
      setIsLoading(true);
      await updateBusinessStatus(businessId, BUSINESS_STATUS.APPROVED);
      setBusiness({
        ...business,
        status: BUSINESS_STATUS.APPROVED
      });
      Alert.alert('Success', `"${business.name}" has been approved.`);
    } catch (error) {
      console.error('Error approving business:', error);
      Alert.alert('Error', 'Failed to approve business.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }
    
    try {
      setIsLoading(true);
      setRejectionModalVisible(false);
      
      await updateBusinessStatus(
        businessId, 
        BUSINESS_STATUS.REJECTED, 
        rejectionReason
      );
      
      setBusiness({
        ...business,
        status: BUSINESS_STATUS.REJECTED,
        rejection_reason: rejectionReason
      });
      
      Alert.alert('Success', `"${business.name}" has been rejected.`);
    } catch (error) {
      console.error('Error rejecting business:', error);
      Alert.alert('Error', 'Failed to reject business.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  
  if (!business) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Business not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* Status Banner */}
      <View 
        style={[
          styles.statusBanner,
          { 
            backgroundColor: 
              business.status === BUSINESS_STATUS.APPROVED ? '#28a745' :
              business.status === BUSINESS_STATUS.REJECTED ? '#dc3545' : '#ffc107'
          }
        ]}
      >
        <Text style={styles.statusText}>
          {business.status === BUSINESS_STATUS.APPROVED ? 'Approved' :
           business.status === BUSINESS_STATUS.REJECTED ? 'Rejected' : 'Pending Approval'}
        </Text>
        
        {business.status === BUSINESS_STATUS.REJECTED && business.rejection_reason && (
          <Text style={styles.rejectionText}>Reason: {business.rejection_reason}</Text>
        )}
      </View>
      
      {/* Business Header */}
      <View style={styles.businessHeader}>
        <Image
          source={require('../../../assets/images/business-placeholder.png')}
          style={styles.businessLogo}
        />
        
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{business.name}</Text>
          <Text style={styles.businessCategory}>
            {business.categories?.name || 'Uncategorized'}
          </Text>
          <Text style={styles.ownerInfo}>
            Owner: {business.profiles?.display_name || business.profiles?.email || 'Unknown'}
          </Text>
        </View>
      </View>
      
      {/* Actions */}
      {business.status === BUSINESS_STATUS.PENDING && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.approveButton}
            onPress={handleApprove}
          >
            <Ionicons name="checkmark-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={() => setRejectionModalVisible(true)}
          >
            <Ionicons name="close-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Business Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Business Details</Text>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailText}>{business.description || 'No description provided'}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Address:</Text>
          <Text style={styles.detailText}>{business.address}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Phone:</Text>
          <Text style={styles.detailText}>{business.phone}</Text>
        </View>
        
        {business.email && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailText}>{business.email}</Text>
          </View>
        )}
        
        {business.website && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Website:</Text>
            <Text style={styles.detailText}>{business.website}</Text>
          </View>
        )}
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailText}>{new Date(business.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      
      {/* Rejection Reason Modal */}
      <Modal
        visible={rejectionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Reason</Text>
            
            <Text style={styles.modalSubtitle}>
              Please provide a reason for rejecting "{business.name}":
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
                onPress={() => setRejectionModalVisible(false)}
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '500',
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
  businessHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  businessLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  businessInfo: {
    flex: 1,
    marginLeft: 16,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  businessCategory: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 4,
  },
  ownerInfo: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
    justifyContent: 'space-around',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
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

export default BusinessDetailsScreen;