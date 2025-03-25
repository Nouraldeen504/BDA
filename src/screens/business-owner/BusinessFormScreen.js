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
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../context/AuthContext';
import { createBusiness, updateBusiness, getBusinessById } from '../../api/businessService';
import { getBusinessCategories } from '../../api/businessService';

const BusinessFormScreen = ({ route, navigation }) => {
  const { businessId } = route.params || {};
  const isEditing = !!businessId;
  const { user } = useAuth();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [logoImage, setLogoImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  
  // UI state
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [errors, setErrors] = useState({});

  // Load business data if editing
  useEffect(() => {
    const fetchData = async () => {
      if (isEditing) {
        try {
          // Fetch business details
          const business = await getBusinessById(businessId);
          
          // Populate form fields
          setName(business.name || '');
          setDescription(business.description || '');
          setAddress(business.address || '');
          setPhone(business.phone || '');
          setEmail(business.email || '');
          setWebsite(business.website || '');
          setCategoryId(business.category_id || null);
          
          // Set images if available
          if (business.logo_url) {
            setLogoImage({ uri: business.logo_url });
          }
          
          if (business.cover_image) {
            setCoverImage({ uri: business.cover_image });
          }
        } catch (error) {
          console.error('Error fetching business:', error);
          Alert.alert(
            'Error',
            'Failed to load business information. Please try again.'
          );
          navigation.goBack();
        } finally {
          setIsFetching(false);
        }
      }
    };
    
    // Load categories
    const fetchCategories = async () => {
      try {
        const categoriesData = await getBusinessCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
    fetchData();
  }, [isEditing, businessId]);

  // Handle logo image picking
  const handlePickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setLogoImage({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking logo image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Handle cover image picking
  const handlePickCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImage({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking cover image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Business name is required';
    }
    
    if (!address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (email && !email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (website && !website.match(/^(http|https):\/\/[a-zA-Z0-9-\.]+\.[a-z]{2,}(\/\S*)?$/)) {
      newErrors.website = 'Invalid website URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare business data
      const businessData = {
        name,
        description,
        address,
        phone,
        email: email || null,
        website: website || null,
        category_id: categoryId || null,
        logo_url: logoImage?.uri || null,
        cover_image: coverImage?.uri || null,
      };
      
      if (isEditing) {
        // Update existing business
        await updateBusiness(businessId, businessData);
        Alert.alert(
          'Business Updated',
          'Your business has been updated successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        // Create new business
        const newBusiness = await createBusiness(businessData);
        Alert.alert(
          'Business Submitted',
          'Your business has been submitted for review. You will be notified once it is approved.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('Error saving business:', error);
      Alert.alert(
        'Error',
        `Failed to ${isEditing ? 'update' : 'create'} business. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading indicator while fetching business data
  if (isFetching) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading business information...</Text>
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
          {/* Business Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Business Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={setName}
              placeholder="Enter business name"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Business Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={categoryId}
                style={styles.picker}
                onValueChange={(itemValue) => setCategoryId(itemValue)}
              >
                <Picker.Item label="Select a category" value={null} />
                {categories.map((category) => (
                  <Picker.Item
                    key={category.id}
                    label={category.name}
                    value={category.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Business Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your business"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Business Address */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, errors.address && styles.inputError]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter business address"
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>

          {/* Business Phone */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phone && styles.inputError]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          {/* Business Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter business email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          {/* Business Website */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Website</Text>
            <TextInput
              style={[styles.input, errors.website && styles.inputError]}
              value={website}
              onChangeText={setWebsite}
              placeholder="Enter website URL"
              keyboardType="url"
              autoCapitalize="none"
            />
            {errors.website && <Text style={styles.errorText}>{errors.website}</Text>}
          </View>

          {/* Logo Image */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Business Logo</Text>
            <View style={styles.imageSection}>
              {logoImage ? (
                <View style={styles.selectedImageContainer}>
                  <Image source={{ uri: logoImage.uri }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setLogoImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickLogo}>
                  <Ionicons name="image-outline" size={32} color="#007bff" />
                  <Text style={styles.imagePickerText}>Choose Logo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Cover Image */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cover Image</Text>
            <View style={styles.imageSection}>
              {coverImage ? (
                <View style={styles.selectedCoverContainer}>
                  <Image source={{ uri: coverImage.uri }} style={styles.selectedCoverImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setCoverImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.coverPickerButton} onPress={handlePickCover}>
                  <Ionicons name="image-outline" size={32} color="#007bff" />
                  <Text style={styles.imagePickerText}>Choose Cover Image</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.requiredFieldsNote}>* Required fields</Text>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Update Business' : 'Submit Business'}
              </Text>
            )}
          </TouchableOpacity>
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
  inputContainer: {
    marginBottom: 16,
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
    minHeight: 120,
    textAlignVertical: 'top',
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
  imageSection: {
    flexDirection: 'row',
    marginTop: 8,
  },
  imagePickerButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverPickerButton: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    backgroundColor: '#f9f9f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#007bff',
    marginTop: 8,
    fontSize: 14,
  },
  selectedImageContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  selectedCoverContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedCoverImage: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
  },
  requiredFieldsNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BusinessFormScreen;