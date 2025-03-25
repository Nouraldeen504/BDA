import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDealById, deleteDeal } from '../../api/dealService';

const DealDetailsScreen = ({ route, navigation }) => {
  const { dealId } = route.params;
  const [deal, setDeal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchDealDetails();
  }, [dealId]);
  
  const fetchDealDetails = async () => {
    try {
      const dealData = await getDealById(dealId);
      setDeal(dealData);
    } catch (error) {
      console.error('Error fetching deal details:', error);
      Alert.alert('Error', 'Failed to load deal details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = () => {
    navigation.navigate('CreateDeal', { dealId: deal.id });
  };
  
  const handleDelete = () => {
    Alert.alert(
      'Delete Deal',
      'Are you sure you want to delete this deal? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };
  
  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      await deleteDeal(deal.id);
      Alert.alert('Success', 'Deal has been deleted.');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting deal:', error);
      Alert.alert('Error', 'Failed to delete deal.');
      setIsLoading(false);
    }
  };
  
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return '#28a745';
      case 'pending': return '#ffc107';
      case 'rejected': return '#dc3545';
      case 'expired': return '#6c757d';
      default: return '#6c757d';
    }
  };
  
  const formatStatus = (status) => {
    switch(status) {
      case 'approved': return 'Active';
      case 'pending': return 'Pending Approval';
      case 'rejected': return 'Rejected';
      case 'expired': return 'Expired';
      default: return status;
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }
  
  if (!deal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Deal not found</Text>
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
          { backgroundColor: getStatusColor(deal.status) }
        ]}
      >
        <Text style={styles.statusText}>{formatStatus(deal.status)}</Text>
        {deal.status === 'rejected' && deal.rejection_reason && (
          <Text style={styles.rejectionText}>Reason: {deal.rejection_reason}</Text>
        )}
      </View>
      
      {/* Deal Header */}
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle}>{deal.title}</Text>
        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{deal.businesses.name}</Text>
        </View>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{deal.discount_value}% OFF</Text>
        </View>
      </View>
      
      {/* Deal Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Description:</Text>
          <Text style={styles.detailText}>{deal.description}</Text>
        </View>
        
        {deal.conditions && (
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Conditions:</Text>
            <Text style={styles.detailText}>{deal.conditions}</Text>
          </View>
        )}
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Date Range:</Text>
          <Text style={styles.detailText}>
            {new Date(deal.start_date).toLocaleDateString()} to {new Date(deal.end_date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailText}>{new Date(deal.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      
      {/* Actions */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEdit}
          disabled={deal.status === 'expired'}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Edit Deal</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Delete Deal</Text>
        </TouchableOpacity>
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
  dealHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  dealTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  businessInfo: {
    marginBottom: 12,
  },
  businessName: {
    fontSize: 18,
    color: '#007bff',
  },
  discountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  detailsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
  },
  detailItem: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-around',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default DealDetailsScreen;