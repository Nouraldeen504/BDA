import supabase from './supabase';

// Business status
export const BUSINESS_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DELETION_REQUESTED: 'deletion_requested',
  DELETED: 'deleted'
};

// Get all approved businesses
export const getAllBusinesses = async () => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        reviews (id, rating)
      `)
      .eq('status', BUSINESS_STATUS.APPROVED)
      .eq('status', BUSINESS_STATUS.APPROVED)
      .not('status', 'eq', BUSINESS_STATUS.DELETED);

    if (error) throw error;

    // Calculate average rating for each business
    const businessesWithRating = data.map(business => {
      const totalReviews = business.reviews.length;
      const averageRating = totalReviews > 0
        ? business.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...business,
        averageRating,
        totalReviews,
      };
    });

    return businessesWithRating;
  } catch (error) {
    console.error('Error fetching businesses:', error.message);
    throw error;
  }
};

// Search businesses by name, category, or location
export const searchBusinesses = async (query, filters = {}) => {
  try {
    let queryBuilder = supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        reviews (id, rating)
      `)
      .eq('status', BUSINESS_STATUS.APPROVED)
      .eq('status', BUSINESS_STATUS.APPROVED)
      .not('status', 'eq', BUSINESS_STATUS.DELETED);

    // Apply search query if provided
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    // Apply category filter if provided
    if (filters.categoryId) {
      queryBuilder = queryBuilder.eq('category_id', filters.categoryId);
    }

    // Apply location filter if provided
    if (filters.location) {
      queryBuilder = queryBuilder.ilike('address', `%${filters.location}%`);
    }

    // Apply sorting if provided
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name_asc':
          queryBuilder = queryBuilder.order('name', { ascending: true });
          break;
        case 'name_desc':
          queryBuilder = queryBuilder.order('name', { ascending: false });
          break;
        case 'created_at_desc':
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
          break;
        default:
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
      }
    } else {
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    const { data, error } = await queryBuilder;

    if (error) throw error;

    // Calculate average rating for each business
    const businessesWithRating = data.map(business => {
      const totalReviews = business.reviews.length;
      const averageRating = totalReviews > 0
        ? business.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...business,
        averageRating,
        totalReviews,
      };
    });

    return businessesWithRating;
  } catch (error) {
    console.error('Error searching businesses:', error.message);
    throw error;
  }
};

// Get business by ID
export const getBusinessById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        reviews (
          id,
          rating,
          comment,
          created_at,
          profiles (id, display_name)
        ),
        deals (id, title, description, start_date, end_date, discount_value)
      `)
      .eq('id', id)
      .eq('status', BUSINESS_STATUS.APPROVED)
      .not('status', 'eq', BUSINESS_STATUS.DELETED)
      .single();

    if (error) throw error;

    // Calculate average rating
    const totalReviews = data.reviews.length;
    const averageRating = totalReviews > 0
      ? data.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
      : 0;
    
    return {
      ...data,
      averageRating,
      totalReviews,
    };
  } catch (error) {
    console.error('Error fetching business details:', error.message);
    throw error;
  }
};

// Create a new business (for business owners)
export const createBusiness = async (businessData) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Create business with pending status
    const { data, error } = await supabase
      .from('businesses')
      .insert([
        {
          ...businessData,
          owner_id: user.id,
          status: BUSINESS_STATUS.PENDING,
          created_at: new Date(),
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating business:', error.message);
    throw error;
  }
};

// Update business information (for business owners)
export const submitBusinessUpdate = async (businessId, updates) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Check business ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single();

    if (businessError) throw businessError;
    if (business.owner_id !== user.id) throw new Error('Not authorized');

    // Insert update request
    const { data, error } = await supabase
      .from('business_updates')
      .insert({
        business_id: businessId,
        owner_id: user.id,
        updates, // store as JSONB
        status: 'pending',
        submitted_at: new Date()
      })
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error submitting business update:', error.message);
    throw error;
  }
};

// Get businesses by owner ID (for business owners)
export const getBusinessesByOwner = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        reviews (id, rating)
      `)
      .eq('owner_id', user.id)
      .eq('status', BUSINESS_STATUS.APPROVED)
      .not('status', 'eq', BUSINESS_STATUS.DELETED)

    if (error) throw error;

    // Calculate average rating for each business
    const businessesWithRating = data.map(business => {
      const totalReviews = business.reviews.length;
      const averageRating = totalReviews > 0
        ? business.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...business,
        averageRating,
        totalReviews,
      };
    });

    return businessesWithRating;
  } catch (error) {
    console.error('Error fetching owner businesses:', error.message);
    throw error;
  }
};

// Get business categories
export const getBusinessCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business categories:', error.message);
    throw error;
  }
};

// Get pending businesses (for admin)
export const getPendingBusinesses = async () => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        profiles (id, email, display_name)
      `)
      .eq('status', BUSINESS_STATUS.PENDING);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pending businesses:', error.message);
    throw error;
  }
};

// Approve or reject a business (for admin)
export const updateBusinessStatus = async (id, status, rejectionReason = null) => {
  try {
    const updates = {
      status,
      reviewed_at: new Date()
    };

    if (status === BUSINESS_STATUS.REJECTED && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating business status:', error.message);
    throw error;
  }
};

// Add business to user bookmarks
export const addBusinessToBookmarks = async (businessId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          user_id: user.id,
          business_id: businessId,
          created_at: new Date(),
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error adding business to bookmarks:', error.message);
    throw error;
  }
};

// Remove business from user bookmarks
export const removeBusinessFromBookmarks = async (businessId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('business_id', businessId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error removing business from bookmarks:', error.message);
    throw error;
  }
};

// Get user bookmarked businesses
export const getBookmarkedBusinesses = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        id,
        created_at,
        businesses (
          id, 
          name, 
          address, 
          logo_url,
          categories (id, name),
          reviews (id, rating)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten and transform the data structure
    const bookmarkedBusinesses = data.map(bookmark => {
      const business = bookmark.businesses;
      const totalReviews = business.reviews.length;
      const averageRating = totalReviews > 0
        ? business.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...business,
        bookmarkId: bookmark.id,
        bookmarkedAt: bookmark.created_at,
        averageRating,
        totalReviews,
      };
    });

    return bookmarkedBusinesses;
  } catch (error) {
    console.error('Error fetching bookmarked businesses:', error.message);
    throw error;
  }
};

// Check if a business is bookmarked by current user
export const isBusinessBookmarked = async (businessId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) throw error;
    return !!data; // Return true if bookmark exists, false otherwise
  } catch (error) {
    console.error('Error checking bookmark status:', error.message);
    throw error;
  }
};


// Request business deletion (business owner)
export const requestBusinessDeletion = async (businessId, reason = '') => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Verify ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id, status')
      .eq('id', businessId)
      .single();

    if (businessError) throw businessError;
    if (!business) throw new Error('Business not found');
    if (business.owner_id !== user.id) {
      throw new Error('You are not authorized to delete this business');
    }
    if (business.status === BUSINESS_STATUS.DELETION_REQUESTED) {
      throw new Error('Deletion already requested');
    }
    if (business.status === BUSINESS_STATUS.DELETED) {
      throw new Error('Business already deleted');
    }

    // Request deletion
    const { data, error } = await supabase
      .from('businesses')
      .update({
        status: BUSINESS_STATUS.DELETION_REQUESTED,
        deletion_requested: true,
        deletion_requested_at: new Date(),
        deletion_reason: reason
      })
      .eq('id', businessId)
      .select();

    if (error) throw error;

    // Log this activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        business_id: businessId,
        activity_type: 'deletion_requested',
        description: `Requested business deletion: ${reason}`,
        metadata: { reason }
      });

    return { 
      success: true, 
      message: 'Deletion request submitted for admin approval',
      business: data[0]
    };
  } catch (error) {
    console.error('Error requesting business deletion:', error.message);
    throw error;
  }
};

// Cancel deletion request (business owner)
export const cancelDeletionRequest = async (businessId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Verify ownership and status
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id, status')
      .eq('id', businessId)
      .single();

    if (businessError) throw businessError;
    if (!business) throw new Error('Business not found');
    if (business.owner_id !== user.id) {
      throw new Error('You are not authorized to modify this business');
    }
    if (business.status !== BUSINESS_STATUS.DELETION_REQUESTED) {
      throw new Error('No pending deletion request to cancel');
    }

    // Cancel deletion request
    const { data, error } = await supabase
      .from('businesses')
      .update({
        status: BUSINESS_STATUS.APPROVED,
        deletion_requested: false,
        deletion_requested_at: null,
        deletion_reason: null
      })
      .eq('id', businessId)
      .select();

    if (error) throw error;

    // Log this activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        business_id: businessId,
        activity_type: 'deletion_cancelled',
        description: 'Cancelled business deletion request'
      });

    return { 
      success: true, 
      message: 'Deletion request cancelled',
      business: data[0]
    };
  } catch (error) {
    console.error('Error cancelling deletion request:', error.message);
    throw error;
  }
};

// Approve business deletion (admin)
export const approveBusinessDeletion = async (businessId) => {
  try {
    // Verify admin privileges (you'll need to implement your own admin check)
    const isAdmin = await checkAdminPrivileges();
    if (!isAdmin) throw new Error('Admin privileges required');

    // Verify business status
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('status, owner_id')
      .eq('id', businessId)
      .single();

    if (businessError) throw businessError;
    if (!business) throw new Error('Business not found');
    if (business.status !== BUSINESS_STATUS.DELETION_REQUESTED) {
      throw new Error('Business does not have a pending deletion request');
    }

    // Perform soft delete
    const { data, error } = await supabase
      .from('businesses')
      .update({
        status: BUSINESS_STATUS.DELETED,
        is_deleted: true,
        deleted_at: new Date()
      })
      .eq('id', businessId)
      .select();

    if (error) throw error;

    // Log this activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: business.owner_id,
        business_id: businessId,
        activity_type: 'deletion_approved',
        description: 'Admin approved business deletion',
        admin_action: true
      });

    return { 
      success: true, 
      message: 'Business deletion approved',
      business: data[0]
    };
  } catch (error) {
    console.error('Error approving business deletion:', error.message);
    throw error;
  }
};

// Reject business deletion (admin)
export const rejectBusinessDeletion = async (businessId, rejectionReason) => {
  try {
    // Verify admin privileges
    const isAdmin = await checkAdminPrivileges();
    if (!isAdmin) throw new Error('Admin privileges required');

    // Verify business status
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('status, owner_id')
      .eq('id', businessId)
      .single();

    if (businessError) throw businessError;
    if (!business) throw new Error('Business not found');
    if (business.status !== BUSINESS_STATUS.DELETION_REQUESTED) {
      throw new Error('Business does not have a pending deletion request');
    }

    // Reject deletion request
    const { data, error } = await supabase
      .from('businesses')
      .update({
        status: BUSINESS_STATUS.APPROVED,
        deletion_requested: false,
        deletion_requested_at: null,
        deletion_reason: null
      })
      .eq('id', businessId)
      .select();

    if (error) throw error;

    // Log this activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: business.owner_id,
        business_id: businessId,
        activity_type: 'deletion_rejected',
        description: `Admin rejected business deletion: ${rejectionReason}`,
        metadata: { rejectionReason },
        admin_action: true
      });

    return { 
      success: true, 
      message: 'Business deletion rejected',
      business: data[0]
    };
  } catch (error) {
    console.error('Error rejecting business deletion:', error.message);
    throw error;
  }
};

// Get businesses pending deletion (admin)
export const getBusinessesPendingDeletion = async () => {
  try {
    // Verify admin privileges
    const isAdmin = await checkAdminPrivileges();
    if (!isAdmin) throw new Error('Admin privileges required');

    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        profiles (id, display_name, email),
        categories (id, name)
      `)
      .eq('status', BUSINESS_STATUS.DELETION_REQUESTED)
      .order('deletion_requested_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching businesses pending deletion:', error.message);
    throw error;
  }
};

export const getPendingBusinessUpdates = async () => {
  try {
    const isAdmin = await checkAdminPrivileges();
    if (!isAdmin) throw new Error('Admin access only');

    const { data, error } = await supabase
      .from('business_updates')
      .select(`
        *,
        businesses (name, id),
        profiles (id, email, display_name)
      `)
      .eq('status', 'pending')
      .order('submitted_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pending updates:', error.message);
    throw error;
  }
};

export const handleBusinessUpdateApproval = async (updateId, approve = true, rejectionReason = null) => {
  try {
    const isAdmin = await checkAdminPrivileges();
    if (!isAdmin) throw new Error('Admin access only');

    // Fetch the update
    const { data: update, error: updateError } = await supabase
      .from('business_updates')
      .select('*')
      .eq('id', updateId)
      .single();

    if (updateError) throw updateError;

    if (approve) {
      // Apply the updates to the business record
      await supabase
        .from('businesses')
        .update(update.updates)
        .eq('id', update.business_id);

      // Mark the update as approved
      await supabase
        .from('business_updates')
        .update({
          status: 'approved',
          reviewed_at: new Date()
        })
        .eq('id', updateId);
    } else {
      // Reject with reason
      await supabase
        .from('business_updates')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_at: new Date()
        })
        .eq('id', updateId);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing update request:', error.message);
    throw error;
  }
};


// Helper function to check admin privileges
async function checkAdminPrivileges() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  
  // Implement your actual admin check logic here
  // This might check a user role in your profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();
    
  return profile?.is_admin === true;
}