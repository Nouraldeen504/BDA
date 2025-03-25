import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SimpleDatePicker from '../../components/common/SimpleDatePicker';
import * as Device from 'expo-device';
import { useAuth } from '../../context/AuthContext';
import { getBusinessesByOwner } from '../../api/businessService';
import { createDeal, getDealById, updateDeal } from '../../api/dealService';
import { Picker } from '@react-native-picker/picker';

const CreateDealScreen = ({ route, navigation }) => {
  const { dealId, businessId: preSelectedBusinessId } = route.params || {};
  const isEditing = !!dealId;
  const { user } = useAuth();
  
  // Form state
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState(preSelectedBusinessId || null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default: 1 week from now
  const [conditions, setConditions] = useState('');
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [errors, setErrors] = useState({});
  // const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  // const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Load user's businesses and deal data if editing
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const userBusinesses = await getBusinessesByOwner();
        // Filter only approved businesses
        const approvedBusinesses = userBusinesses.filter(business => business.status === 'approved');
        setBusinesses(approvedBusinesses);
        
        // If no business pre-selected and we have approved businesses, select the first one
        if (!preSelectedBusinessId && approvedBusinesses.length > 0) {
          setSelectedBusinessId(approvedBusinesses[0].id);
        }
      } catch (error) {
        console.error('Error fetching businesses:', error);
        Alert.alert(
          'Error',
          'Failed to load your businesses. Please try again.'
        );
      }
    };
    
    const fetchDeal = async () => {
      if (isEditing) {
        try {
          const deal = await getDealById(dealId);
          
          setTitle(deal.title || '');
          setDescription(deal.description || '');
          setDiscountValue(deal.discount_value ? deal.discount_value.toString() : '');
          setStartDate(new Date(deal.start_date));
          setEndDate(new Date(deal.end_date));
          setConditions(deal.conditions || '');
          setSelectedBusinessId(deal.business_id);
        } catch (error) {
          console.error('Error fetching deal:', error);
          Alert.alert(
            'Error',
            'Failed to load deal information. Please try again.'
          );
          navigation.goBack();
        } finally {
          setIsFetching(false);
        }
      }
    };
    
    fetchBusinesses();
    fetchDeal();
  }, [isEditing, dealId, preSelectedBusinessId]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedBusinessId) {
      newErrors.business = 'Please select a business';
    }
    
    if (!title.trim()) {
      newErrors.title = 'Deal title is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!discountValue.trim()) {
      newErrors.discountValue = 'Discount value is required';
    } else if (isNaN(discountValue) || parseFloat(discountValue) <= 0 || parseFloat(discountValue) > 100) {
      newErrors.discountValue = 'Discount must be a number between 0 and 100';
    }
    
    if (startDate >= endDate) {
      newErrors.dates = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle start date change
  /*const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  // Handle end date change
  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };*/

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare deal data
      const dealData = {
        business_id: selectedBusinessId,
        title,
        description,
        discount_value: parseFloat(discountValue),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        conditions: conditions.trim() || null,
      };
      
      if (isEditing) {
        // Update existing deal
        await updateDeal(dealId, dealData);
        Alert.alert(
          'Deal Updated',
          'Your deal has been updated and will be reviewed for approval.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Create new deal
        const newDeal = await createDeal(selectedBusinessId, dealData);
        Alert.alert(
          'Deal Created',
          'Your deal has been created and will be reviewed for approval.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error saving deal:', error);
      Alert.alert(
        'Error',
        `Failed to ${isEditing ? 'update' : 'create'} deal. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator
  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading deal information...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.formContainer}>
          {/* Business Selection */}
          {businesses.length > 0 ? (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Business *</Text>
              <View style={[styles.pickerContainer, errors.business && styles.inputError]}>
                <Picker
                  selectedValue={selectedBusinessId}
                  style={styles.picker}
                  onValueChange={(itemValue) => setSelectedBusinessId(itemValue)}
                  enabled={!preSelectedBusinessId && !isEditing}
                >
                  <Picker.Item label="Select a business" value={null} />
                  {businesses.map((business) => (
                    <Picker.Item
                      key={business.id}
                      label={business.name}
                      value={business.id}
                    />
                  ))}
                </Picker>
              </View>
              {errors.business && <Text style={styles.errorText}>{errors.business}</Text>}
            </View>
          ) : (
            <View style={styles.noBusinessesContainer}>
              <Ionicons name="alert-circle-outline" size={24} color="#f44336" />
              <Text style={styles.noBusinessesText}>
                You don't have any approved businesses. Get your business approved before creating deals.
              </Text>
            </View>
          )}

          {/* Deal Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Deal Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={setTitle}
              placeholder="E.g., '50% Off All Pizzas'"
              maxLength={50}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            <Text style={styles.charCount}>{title.length}/50</Text>
          </View>

          {/* Discount Value */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Discount Percentage *</Text>
            <TextInput
              style={[styles.input, errors.discountValue && styles.inputError]}
              value={discountValue}
              onChangeText={setDiscountValue}
              placeholder="Enter discount percentage (e.g., 20)"
              keyboardType="numeric"
            />
            {errors.discountValue && <Text style={styles.errorText}>{errors.discountValue}</Text>}
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the deal in detail"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
            <Text style={styles.charCount}>{description.length}/200</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Deal Period *</Text>
            
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Start Date:</Text>
                <SimpleDatePicker
                  value={startDate}
                  onChange={(date) => setStartDate(date)}
                  minimumDate={new Date()}
                />
              </View>
              
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>End Date:</Text>
                <SimpleDatePicker
                  value={endDate}
                  onChange={(date) => setEndDate(date)}
                  minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
                />
              </View>
            </View>
            
            {errors.dates && <Text style={styles.errorText}>{errors.dates}</Text>}
          </View>

          {/* Date Range 
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Deal Period *</Text>
            
            <View style={styles.datePickerRow}>
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Start Date:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {startDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>End Date:</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateText}>
                    {endDate.toLocaleDateString()}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>
            </View>
            
            {errors.dates && <Text style={styles.errorText}>{errors.dates}</Text>}
            
            {showStartDatePicker && (
              Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={onStartDateChange}
                  minimumDate={new Date()}
                />
              ) : (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={onStartDateChange}
                  minimumDate={new Date()}
                />
              )
            )}
            
            {showEndDatePicker && (
              Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="spinner"
                  onChange={onEndDateChange}
                  minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
                />
              ) : (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={onEndDateChange}
                  minimumDate={new Date(startDate.getTime() + 24 * 60 * 60 * 1000)}
                />
              )
            )}
          </View>*/}

          {/* Conditions (Optional) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Conditions (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={conditions}
              onChangeText={setConditions}
              placeholder="Enter any conditions or restrictions (e.g., 'Not valid with other offers')"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={100}
            />
            <Text style={styles.charCount}>{conditions.length}/100</Text>
          </View>

          <Text style={styles.requiredFieldsNote}>* Required fields</Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (isLoading || businesses.length === 0) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={isLoading || businesses.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Deal' : 'Create Deal'}
              </Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.noteText}>
            Note: All deals require admin approval before becoming visible to users.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noBusinessesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff4f4',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  noBusinessesText: {
    color: '#f44336',
    marginLeft: 10,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerContainer: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  requiredFieldsNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default CreateDealScreen;