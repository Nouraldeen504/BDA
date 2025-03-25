import supabase from './supabase';
import { BUSINESS_STATUS } from './businessService';
import { REVIEW_STATUS } from './reviewService';
import { DEAL_STATUS } from './dealService';

export const getDashboardAnalytics = async () => {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    if (usersError) throw usersError;

    // Get business counts by status
    const { data: businessStats, error: businessError } = await supabase
      .from('businesses')
      .select('status')
      .in('status', [BUSINESS_STATUS.PENDING, BUSINESS_STATUS.APPROVED, BUSINESS_STATUS.REJECTED]);

    if (businessError) throw businessError;

    const businessCounts = {
      total: businessStats.length,
      pending: businessStats.filter(b => b.status === BUSINESS_STATUS.PENDING).length,
      approved: businessStats.filter(b => b.status === BUSINESS_STATUS.APPROVED).length,
      rejected: businessStats.filter(b => b.status === BUSINESS_STATUS.REJECTED).length,
    };

    // Get review counts by status
    const { data: reviewStats, error: reviewError } = await supabase
      .from('reviews')
      .select('status')
      .in('status', [REVIEW_STATUS.PENDING, REVIEW_STATUS.APPROVED, REVIEW_STATUS.REJECTED]);

    if (reviewError) throw reviewError;

    const reviewCounts = {
      total: reviewStats.length,
      pending: reviewStats.filter(r => r.status === REVIEW_STATUS.PENDING).length,
      approved: reviewStats.filter(r => r.status === REVIEW_STATUS.APPROVED).length,
      rejected: reviewStats.filter(r => r.status === REVIEW_STATUS.REJECTED).length,
    };

    // Get deal counts by status
    const { data: dealStats, error: dealError } = await supabase
      .from('deals')
      .select('status')
      .in('status', [DEAL_STATUS.PENDING, DEAL_STATUS.APPROVED, DEAL_STATUS.REJECTED, DEAL_STATUS.EXPIRED]);

    if (dealError) throw dealError;

    const dealCounts = {
      total: dealStats.length,
      pending: dealStats.filter(d => d.status === DEAL_STATUS.PENDING).length,
      approved: dealStats.filter(d => d.status === DEAL_STATUS.APPROVED).length,
      rejected: dealStats.filter(d => d.status === DEAL_STATUS.REJECTED).length,
      expired: dealStats.filter(d => d.status === DEAL_STATUS.EXPIRED).length,
    };

    // Get recent user signups
    const { data: recentUsers, error: recentUsersError } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentUsersError) throw recentUsersError;

    return {
      userStats: {
        total: totalUsers,
        recent: recentUsers
      },
      businessStats: businessCounts,
      reviewStats: reviewCounts,
      dealStats: dealCounts
    };
  } catch (error) {
    console.error('Error fetching admin dashboard analytics:', error.message);
    throw error;
  }
};

// Get users list with optional filtering and pagination
export const getUsers = async (filters = {}, page = 1, limit = 20) => {
  try {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    // Apply role filter
    if (filters.role) {
      query = query.eq('role', filters.role);
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(`email.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
    }

    // Apply sorting
    if (filters.sortBy) {
      const [field, direction] = filters.sortBy.split('_');
      query = query.order(field, { ascending: direction === 'asc' });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw error;

    return {
      users: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    console.error('Error fetching users:', error.message);
    throw error;
  }
};

// Manage categories
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error.message);
    throw error;
  }
};

export const createCategory = async (name, description = '', parent_id = null) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name,
          description,
          parent_id,
          created_at: new Date()
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating category:', error.message);
    throw error;
  }
};

export const updateCategory = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating category:', error.message);
    throw error;
  }
};

export const deleteCategory = async (id) => {
  try {
    // Check if the category is in use
    const { count: businessCount, error: businessError } = await supabase
      .from('businesses')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (businessError) throw businessError;

    if (businessCount > 0) {
      throw new Error('Cannot delete category that is in use by businesses');
    }

    // Check if the category has children
    const { count: childrenCount, error: childrenError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', id);

    if (childrenError) throw childrenError;

    if (childrenCount > 0) {
      throw new Error('Cannot delete category that has subcategories');
    }

    // Delete the category
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error.message);
    throw error;
  }
};

// Feature/Unfeature a deal
export const toggleDealFeatureStatus = async (dealId, isFeatured) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .update({ is_featured: isFeatured })
      .eq('id', dealId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error toggling deal feature status:', error.message);
    throw error;
  }
};

// Get system activity logs
export const getActivityLogs = async (page = 1, limit = 20) => {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabase
      .from('activity_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      logs: data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit)
    };
  } catch (error) {
    console.error('Error fetching activity logs:', error.message);
    throw error;
  }
};

// Generate reports
export const generateBusinessReport = async (filters = {}, format = 'json') => {
  try {
    let query = supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        reviews (id, rating),
        profiles (id, email, display_name)
      `);

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    // Apply category filter
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    // Apply date range filter
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Process the data to add additional metrics
    const reportData = data.map(business => {
      const totalReviews = business.reviews.length;
      const averageRating = totalReviews > 0
        ? business.reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews
        : 0;

      return {
        id: business.id,
        name: business.name,
        category: business.categories?.name || 'Uncategorized',
        status: business.status,
        owner: business.profiles?.display_name || 'Unknown',
        ownerEmail: business.profiles?.email || 'Unknown',
        created_at: business.created_at,
        totalReviews,
        averageRating
      };
    });

    if (format === 'csv') {
      // Format as CSV
      const headers = Object.keys(reportData[0] || {}).join(',');
      const rows = reportData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
        ).join(',')
      );
      return `${headers}\n${rows.join('\n')}`;
    }

    return reportData;
  } catch (error) {
    console.error('Error generating business report:', error.message);
    throw error;
  }
};

// Manage promotional content
export const getFeaturedBusinesses = async () => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        reviews (id, rating)
      `)
      .eq('status', BUSINESS_STATUS.APPROVED)
      .eq('is_featured', true)
      .order('featured_order');

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
    console.error('Error fetching featured businesses:', error.message);
    throw error;
  }
};

export const toggleBusinessFeatureStatus = async (businessId, isFeatured) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .update({
        is_featured: isFeatured,
        featured_order: isFeatured ? 99 : null // Default to end of list when featuring
      })
      .eq('id', businessId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error toggling business feature status:', error.message);
    throw error;
  }
};

export const updateFeaturedBusinessOrder = async (businessId, newOrder) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .update({ featured_order: newOrder })
      .eq('id', businessId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating featured business order:', error.message);
    throw error;
  }
};

// Track user activities for auditing purposes
export const logActivity = async (action, details, targetType, targetId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { error } = await supabase
      .from('activity_logs')
      .insert([
        {
          user_id: user.id,
          action,
          details,
          target_type: targetType,
          target_id: targetId,
          created_at: new Date()
        }
      ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error logging activity:', error.message);
    // Don't throw here, just log to console - we don't want activity logging to break main functionality
    return { success: false, error: error.message };
  }
};

// Get business verification requests
export const getBusinessVerificationRequests = async (status = BUSINESS_STATUS.PENDING) => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select(`
        *,
        categories (id, name),
        profiles (id, email, display_name, phone)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business verification requests:', error.message);
    throw error;
  }
};

// Suspend or ban a user
export const updateUserStatus = async (userId, isActive, reason = null) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_active: isActive,
        deactivation_reason: isActive ? null : reason,
        deactivated_at: isActive ? null : new Date()
      })
      .eq('id', userId)
      .select();

    if (error) throw error;
    
    // Log this important admin action
    await logActivity(
      isActive ? 'user_activated' : 'user_deactivated',
      reason,
      'user',
      userId
    );
    
    return data[0];
  } catch (error) {
    console.error('Error updating user status:', error.message);
    throw error;
  }
};

// Get system statistics for analytics dashboard
export const getSystemStats = async (period = 'month') => {
  try {
    const today = new Date();
    let startDate;
    
    // Determine start date based on period
    if (period === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(today);
      startDate.setMonth(today.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 1);
    } else {
      throw new Error('Invalid period. Use "week", "month", or "year"');
    }
    
    const startDateIso = startDate.toISOString();
    
    // Get user signups over period
    const { data: userSignups, error: userError } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDateIso);
    
    if (userError) throw userError;
    
    // Get business registrations over period
    const { data: businessRegistrations, error: businessError } = await supabase
      .from('businesses')
      .select('created_at, status')
      .gte('created_at', startDateIso);
    
    if (businessError) throw businessError;
    
    // Get reviews over period
    const { data: reviews, error: reviewError } = await supabase
      .from('reviews')
      .select('created_at, status')
      .gte('created_at', startDateIso);
    
    if (reviewError) throw reviewError;
    
    // Group data by date for time-series charts
    const stats = {
      userSignups: groupByDate(userSignups, 'created_at', period),
      businessRegistrations: groupByDate(businessRegistrations, 'created_at', period),
      businessApprovals: groupByDate(
        businessRegistrations.filter(b => b.status === BUSINESS_STATUS.APPROVED),
        'created_at',
        period
      ),
      reviews: groupByDate(reviews, 'created_at', period),
      approvedReviews: groupByDate(
        reviews.filter(r => r.status === REVIEW_STATUS.APPROVED),
        'created_at',
        period
      )
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching system stats:', error.message);
    throw error;
  }
};

// Helper function to group data by date
const groupByDate = (data, dateField, period) => {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    let key;
    
    if (period === 'week' || period === 'month') {
      // Group by day for week and month periods
      key = date.toISOString().split('T')[0];
    } else {
      // Group by month for year period
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    if (!grouped[key]) {
      grouped[key] = 0;
    }
    
    grouped[key]++;
  });
  
  // Convert to array format for charts
  return Object.entries(grouped).map(([date, count]) => ({
    date,
    count
  }));
};