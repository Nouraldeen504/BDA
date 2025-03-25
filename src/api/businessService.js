import supabase from './supabase';

// Business status
export const BUSINESS_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
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
      .eq('status', BUSINESS_STATUS.APPROVED);

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
      .eq('status', BUSINESS_STATUS.APPROVED);

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
export const updateBusiness = async (id, updates) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Get the business to verify ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (businessError) throw businessError;

    // Verify that the current user is the owner
    if (business.owner_id !== user.id) {
      throw new Error('You are not authorized to update this business');
    }

    // Update the business
    const { data, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating business:', error.message);
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
      .eq('owner_id', user.id);

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