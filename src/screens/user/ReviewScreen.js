import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { submitReview, uploadReviewPhoto } from '../../api/reviewService';
import { useAuth } from '../../context/AuthContext';

const MAX_PHOTOS = 3;

const ReviewScreen = ({ route, navigation }) => {
  const { businessId, businessName } = route.params;
  const { user } = useAuth();
  
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [charCount, setCharCount] = useState(0);

  // Get camera roll permission
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Handle rating selection
  const handleRating = (selectedRating) => {
    setRating(selectedRating);
  };

  // Handle comment text change
  const handleCommentChange = (text) => {
    setComment(text);
    setCharCount(text.length);
  };

  // Handle image picking
  const handlePickImage = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'This app needs access to your photo library to attach photos to reviews.'
      );
      return;
    }

    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Photo Limit', `You can only add up to ${MAX_PHOTOS} photos per review.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add new photo to the array
        setPhotos([...photos, { uri: result.assets[0].uri, uploaded: false }]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Remove photo
  const handleRemovePhoto = (index) => {
    const updatedPhotos = [...photos];
    updatedPhotos.splice(index, 1);
    setPhotos(updatedPhotos);
  };

  // Submit review
  const handleSubmitReview = async () => {
    // Validate input
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a rating to submit your review.');
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert('Review Too Short', 'Please write a review of at least 10 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload photos if any
      let photoUrls = [];
      if (photos.length > 0) {
        // This is a simplified version; in a real app, you'd need to handle file conversions and uploads
        // For demo purposes, we're just using the local URIs
        photoUrls = photos.map(photo => photo.uri);
        
        // In a real implementation, you would upload each photo:
        // for (const photo of photos) {
        //   const response = await fetch(photo.uri);
        //   const blob = await response.blob();
        //   const fileName = photo.uri.split('/').pop();
        //   const photoUrl = await uploadReviewPhoto({ name: fileName, type: 'image/jpeg', uri: photo.uri });
        //   photoUrls.push(photoUrl);
        // }
      }

      // Submit the review
      await submitReview(businessId, rating, comment, photoUrls);

      Alert.alert(
        'Review Submitted',
        'Your review has been submitted and is pending approval. Thank you for your feedback!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Submission Error', 'Failed to submit your review. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentContainer}>
          {/* Business name */}
          <Text style={styles.businessName}>{businessName}</Text>
          
          {/* Rating selection */}
          <View style={styles.ratingContainer}>
            <Text style={styles.sectionTitle}>Your Rating</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => handleRating(star)}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={40}
                    color={star <= rating ? '#FFD700' : '#ccc'}
                    style={styles.starIcon}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.ratingText}>
              {rating === 0
                ? 'Tap to rate'
                : rating === 1
                ? 'Poor'
                : rating === 2
                ? 'Fair'
                : rating === 3
                ? 'Good'
                : rating === 4
                ? 'Very Good'
                : 'Excellent'}
            </Text>
          </View>
          
          {/* Review comment */}
          <View style={styles.reviewContainer}>
            <Text style={styles.sectionTitle}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience at this business..."
              value={comment}
              onChangeText={handleCommentChange}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{charCount} characters</Text>
          </View>
          
          {/* Photo upload */}
          <View style={styles.photoContainer}>
            <Text style={styles.sectionTitle}>Add Photos (Optional)</Text>
            <Text style={styles.photoSubtitle}>
              Share photos of your experience (max {MAX_PHOTOS} photos)
            </Text>
            
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {photos.length < MAX_PHOTOS && (
                <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickImage}>
                  <Ionicons name="camera-outline" size={30} color="#007bff" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Submit button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 || comment.trim().length < 10 || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmitReview}
            disabled={rating === 0 || comment.trim().length < 10 || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Submit Review</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.disclaimer}>
            Your review will be published after it's approved. Please follow our community guidelines.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  businessName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  ratingContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  reviewContainer: {
    marginBottom: 24,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 120,
    backgroundColor: '#f9f9f9',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  photoContainer: {
    marginBottom: 24,
  },
  photoSubtitle: {
    color: '#666',
    marginBottom: 12,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoItem: {
    width: 100,
    height: 100,
    margin: 5,
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -10,
    right: -10,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#f9f9f9',
  },
  addPhotoText: {
    color: '#007bff',
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disclaimer: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
});

export default ReviewScreen;