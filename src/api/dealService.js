import supabase from './supabase';

// Deal status
export const DEAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

// Get all active deals
export const getActiveDeals = async () => {
  try {
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        businesses (
          id, 
          name, 
          address, 
          logo_url,
          categories (id, name)
        )
      `)
      .eq('status', DEAL_STATUS.APPROVED)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching active deals:', error.message);
    throw error;
  }
};

// Get deal by ID
export const getDealById = async (dealId) => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        businesses (id, name)
      `)
      .eq('id', dealId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching deal:', error.message);
    throw error;
  }
};

// Get deals for a business
export const getBusinessDeals = async (businessId) => {
  try {
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('business_id', businessId)
      .eq('status', DEAL_STATUS.APPROVED)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching business deals:', error.message);
    throw error;
  }
};

// Create a new deal (for business owners)
export const createDeal = async (businessId, dealData) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Verify business ownership
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', businessId)
      .single();

    if (businessError) throw businessError;

    if (business.owner_id !== user.id) {
      throw new Error('You are not authorized to create deals for this business');
    }

    // Create the deal with pending status
    const { data, error } = await supabase
      .from('deals')
      .insert([
        {
          ...dealData,
          business_id: businessId,
          status: DEAL_STATUS.PENDING,
          created_at: new Date(),
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error creating deal:', error.message);
    throw error;
  }
};

// Update a deal (for business owners)
export const updateDeal = async (dealId, updates) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Get the deal with business info to verify ownership
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        businesses (id, owner_id)
      `)
      .eq('id', dealId)
      .single();

    if (dealError) throw dealError;

    // Verify ownership
    if (deal.businesses.owner_id !== user.id) {
      throw new Error('You are not authorized to update this deal');
    }

    // Update the deal
    const { data, error } = await supabase
      .from('deals')
      .update({
        ...updates,
        status: DEAL_STATUS.PENDING, // Reset to pending for approval
        updated_at: new Date(),
      })
      .eq('id', dealId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating deal:', error.message);
    throw error;
  }
};

// Delete a deal (for business owners)
export const deleteDeal = async (dealId) => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Get the deal with business info to verify ownership
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        businesses (id, owner_id)
      `)
      .eq('id', dealId)
      .single();

    if (dealError) throw dealError;

    // Verify ownership
    if (deal.businesses.owner_id !== user.id) {
      throw new Error('You are not authorized to delete this deal');
    }

    // Delete the deal
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error deleting deal:', error.message);
    throw error;
  }
};

// Get deals by business owner
export const getDealsByBusinessOwner = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    // Get businesses owned by the user
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id);

    if (businessError) throw businessError;

    // If no businesses, return empty array
    if (!businesses.length) return [];

    // Get all deals for these businesses
    const businessIds = businesses.map(business => business.id);
    
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        businesses (id, name, logo_url)
      `)
      .in('business_id', businessIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching owner deals:', error.message);
    throw error;
  }
};

// Get pending deals (for admin)
export const getPendingDeals = async () => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        businesses (id, name, owner_id, 
          profiles (id, display_name, email)
        )
      `)
      .eq('status', DEAL_STATUS.PENDING)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching pending deals:', error.message);
    throw error;
  }
};

// Approve or reject a deal (for admin)
export const updateDealStatus = async (dealId, status, rejectionReason = null) => {
  try {
    const updates = {
      status,
      moderated_at: new Date()
    };

    if (status === DEAL_STATUS.REJECTED && rejectionReason) {
      updates.rejection_reason = rejectionReason;
    }

    const { data, error } = await supabase
      .from('deals')
      .update(updates)
      .eq('id', dealId)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Error updating deal status:', error.message);
    throw error;
  }
};

// Get featured deals for the home screen
export const getFeaturedDeals = async (limit = 5) => {
  try {
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        businesses (
          id, 
          name, 
          address, 
          logo_url,
          categories (id, name)
        )
      `)
      .eq('status', DEAL_STATUS.APPROVED)
      .eq('is_featured', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching featured deals:', error.message);
    throw error;
  }
};