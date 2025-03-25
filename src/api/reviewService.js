import supabase from './supabase';

// Review status
export const REVIEW_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

// Get reviews for a business
export const getBusinessReviews = async (businessId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (id, display_name, avatar_url)
      `)
      .eq('business_id', businessId)
      .eq('status', REVIEW_STATUS.APPROVED)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business reviews:', error.message);
    throw error;
  }
};

// Submit a new review
export const submitReview = async (businessId, rating, comment, photos = []) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Check if user has already reviewed this business
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (checkError) throw checkError;

    // If review exists, update it
    if (existingReview) {
      const { data, error } = await supabase
        .from('reviews')
        .update({
          rating,
          comment,
          photos,
          updated_at: new Date(),
          status: REVIEW_STATUS.PENDING, // Reset to pending for moderation if updating
        })
        .eq('id', existingReview.id)
        .select();

      if (error) throw error;
      return data[0];
    }

    // Otherwise, create a new review
    const { data, error } = await supabase
      .from('reviews')
      .insert([
        {
          business_id: businessId,
          user_id: user.id,
          rating,
          comment,
          photos,
          created_at: new Date(),
          status: REVIEW_STATUS.PENDING, // Start as pending for moderation
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error submitting review:', error.message);
    throw error;
  }
};

// Upload review photo
export const uploadReviewPhoto = async (file) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `review-photos/${fileName}`;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from('review-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('review-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading review photo:', error.message);
    throw error;
  }
};

// Get reviews submitted by current user
export const getUserReviews = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        businesses (id, name, address, logo_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user reviews:', error.message);
    throw error;
  }
};

// Delete a review
export const deleteReview = async (reviewId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Check if the review belongs to the user
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('user_id')
      .eq('id', reviewId)
      .single();

    if (reviewError) throw reviewError;

    if (review.user_id !== user.id) {
      throw new Error('You are not authorized to delete this review');
    }

    // Delete the review
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting review:', error.message);
    throw error;
  }
};

// Get pending reviews (for admin)
export const getPendingReviews = async () => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        profiles (id, display_name, email),
        businesses (id, name)
      `)
      .eq('status', REVIEW_STATUS.PENDING)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pending reviews:', error.message);
    throw error;
  }
};

// Approve or reject a review (for admin)
export const updateReviewStatus = async (reviewId, status, rejectionReason = null) => {
  try {
    const updates = {
      status,
      moderated_at: new Date()
    };

    if (status === REVIEW_STATUS.REJECTED && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating review status:', error.message);
    throw error;
  }
};

// Get review statistics for a business
export const getBusinessReviewStats = async (businessId) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('business_id', businessId)
      .eq('status', REVIEW_STATUS.APPROVED);

    if (error) throw error;

    const totalReviews = data.length;
    
    if (totalReviews === 0) {
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0
        }
      };
    }

    // Calculate average rating
    const averageRating = data.reduce((acc, review) => acc + review.rating, 0) / totalReviews;

    // Calculate rating distribution
    const ratingDistribution = data.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1;
      return acc;
    }, {});

    // Make sure all rating values (1-5) are represented
    for (let i = 1; i <= 5; i++) {
      if (!ratingDistribution[i]) {
        ratingDistribution[i] = 0;
      }
    }

    return {
      totalReviews,
      averageRating,
      ratingDistribution
    };
  } catch (error) {
    console.error('Error fetching business review stats:', error.message);
    throw error;
  }
};