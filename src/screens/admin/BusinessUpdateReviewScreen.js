import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { handleBusinessUpdateApproval, getBusinessUpdateById } from '../../api/businessService';

const BusinessUpdateReviewScreen = ({ route, navigation }) => {
  const { updateId } = route.params;

  const [update, setUpdate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    const fetchUpdate = async () => {
      try {
        const data = await getBusinessUpdateById(updateId);
        setUpdate(data);
      } catch (err) {
        Alert.alert('Error', 'Failed to load business update.');
      } finally {
        setLoading(false);
      }
    };

    fetchUpdate();
  }, [updateId]);

  const handleApprove = async () => {
    try {
      setLoading(true);
      await handleBusinessUpdateApproval(updateId, 'approved');
      Alert.alert('Approved', 'Update has been approved.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to approve update.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for rejection.');
      return;
    }

    try {
      setLoading(true);
      setRejectionModalVisible(false);
      await handleBusinessUpdateApproval(updateId, 'rejected', rejectionReason);
      Alert.alert('Rejected', 'Update has been rejected.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject update.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (!update) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#666' }}>Update not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.heading}>Business Update Review</Text>
        <Text style={styles.label}>Business Name:</Text>
        <Text style={styles.value}>{update.name}</Text>

        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{update.description || 'N/A'}</Text>

        <Text style={styles.label}>Address:</Text>
        <Text style={styles.value}>{update.address || 'N/A'}</Text>

        <Text style={styles.label}>Phone:</Text>
        <Text style={styles.value}>{update.phone || 'N/A'}</Text>

        {update.website && (
          <>
            <Text style={styles.label}>Website:</Text>
            <Text style={styles.value}>{update.website}</Text>
          </>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
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

      {/* Rejection Modal */}
      <Modal
        visible={rejectionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Rejection Reason</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason"
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setRejectionModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleReject}>
                <Text style={styles.confirmText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  section: { padding: 20, backgroundColor: '#fff', marginTop: 10 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontWeight: '600', marginTop: 12, color: '#555' },
  value: { fontSize: 16, color: '#333' },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  approveButton: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectButton: {
    flexDirection: 'row',
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', marginLeft: 8, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
  },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    minHeight: 80,
    backgroundColor: '#f9f9f9',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: { padding: 10, marginRight: 12 },
  cancelText: { color: '#555' },
  confirmButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 4,
  },
  confirmText: { color: '#fff', fontWeight: 'bold' },
});

export default BusinessUpdateReviewScreen;
