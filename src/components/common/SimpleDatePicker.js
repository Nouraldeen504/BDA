import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SimpleDatePicker = ({ 
  value, 
  onChange, 
  minimumDate = new Date(1970, 0, 1),
  maximumDate = new Date(2100, 11, 31)
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());
  
  const handleConfirm = () => {
    onChange(tempDate);
    setModalVisible(false);
  };
  
  // Date manipulation functions
  const addDays = (days) => {
    const newDate = new Date(tempDate);
    newDate.setDate(tempDate.getDate() + days);
    
    // Check bounds
    if (newDate < minimumDate) return;
    if (newDate > maximumDate) return;
    
    setTempDate(newDate);
  };
  
  const addMonths = (months) => {
    const newDate = new Date(tempDate);
    newDate.setMonth(tempDate.getMonth() + months);
    
    // Check bounds
    if (newDate < minimumDate) return;
    if (newDate > maximumDate) return;
    
    setTempDate(newDate);
  };
  
  const addYears = (years) => {
    const newDate = new Date(tempDate);
    newDate.setFullYear(tempDate.getFullYear() + years);
    
    // Check bounds
    if (newDate < minimumDate) return;
    if (newDate > maximumDate) return;
    
    setTempDate(newDate);
  };
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return (
    <View>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.dateText}>{value.toLocaleDateString()}</Text>
        <Ionicons name="calendar-outline" size={20} color="#007bff" />
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>
            
            {/* Year */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>Year</Text>
              <View style={styles.dateAdjuster}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => addYears(-1)}
                >
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.currentValue}>{tempDate.getFullYear()}</Text>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => addYears(1)}
                >
                  <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Month */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>Month</Text>
              <View style={styles.dateAdjuster}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => addMonths(-1)}
                >
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.currentValue}>{monthNames[tempDate.getMonth()]}</Text>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => addMonths(1)}
                >
                  <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Day */}
            <View style={styles.dateSection}>
              <Text style={styles.dateSectionLabel}>Day</Text>
              <View style={styles.dateAdjuster}>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => addDays(-1)}
                >
                  <Text style={styles.adjustButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.currentValue}>{tempDate.getDate()}</Text>
                <TouchableOpacity 
                  style={styles.adjustButton}
                  onPress={() => addDays(1)}
                >
                  <Text style={styles.adjustButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <Text style={styles.datePreview}>
              {tempDate.toLocaleDateString()}
            </Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateSection: {
    marginBottom: 15,
  },
  dateSectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  dateAdjuster: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustButton: {
    width: 36,
    height: 36,
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  currentValue: {
    fontSize: 16,
    width: 120,
    textAlign: 'center',
  },
  datePreview: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cancelButton: {
    padding: 10,
  },
  cancelButtonText: {
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SimpleDatePicker;