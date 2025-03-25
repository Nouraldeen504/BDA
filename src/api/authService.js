import supabase from './supabase';

// User roles
export const USER_ROLES = {
  NORMAL_USER: 'normal_user',
  BUSINESS_OWNER: 'business_owner',
  ADMIN: 'admin'
};

// Sign up a new user
export const signUp = async (email, password, role = USER_ROLES.NORMAL_USER, userData = {}) => {
  console.log('Starting signup process with:', { email, role, userData });
  try {
    // Register the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          display_name: userData.display_name,
        }
      }
    });

    if (authError) {
      console.error('Auth Error Details:', authError);
      throw authError;
    }

    // Log the user ID from Supabase Auth
    console.log('User ID from Auth:', authData.user.id);

    console.log('User Data: ', userData)

    // Create a record in the profiles table with additional user data
    // const { error: profileError } = await supabase
    //   .from('profiles')
    //   .insert([
    //     {
    //       id: authData.user.id,
    //       email,
    //       role,
    //       created_at: new Date()
    //     }
    //   ]);

    //   if (profileError) {
    //     console.error('Profile Error Details:', profileError);
    //     throw profileError;
    //   }

    return { user: authData.user, session: authData.session };
  } catch (error) {
    console.error('Error signing up:', error.message);
    throw error;
  }
};

// Sign in existing user
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in:', error.message);
    throw error;
  }
};

// Sign out user
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'yourapp://reset-password',
    });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error.message);
    throw error;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }
};

// Get user profile with role information
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error.message);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error.message);
    throw error;
  }
};

// Change user role (admin only)
export const changeUserRole = async (userId, newRole) => {
  try {
    // First update the custom claims in auth.users
    const { error: authError } = await supabase.functions.invoke('update-user-role', {
      body: { userId, role: newRole },
    });

    if (authError) throw authError;

    // Then update the role in the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (profileError) throw profileError;

    return { success: true };
  } catch (error) {
    console.error('Error changing user role:', error.message);
    throw error;
  }
};