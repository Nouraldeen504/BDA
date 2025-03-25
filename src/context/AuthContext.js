import React, { createContext, useState, useEffect, useContext } from 'react';
import supabase from '../api/supabase';
import { getCurrentUser, getUserProfile, USER_ROLES } from '../api/authService';
import * as SplashScreen from 'expo-splash-screen';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create context
export const AuthContext = createContext({
  user: null,
  profile: null,
  isLoading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  isAdmin: () => false,
  isBusinessOwner: () => false,
  isNormalUser: () => false,
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user session exists on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error checking auth state:', error.message);
      } finally {
        setIsLoading(false);
        await SplashScreen.hideAsync();
      }
    };

    checkUser();

    // Set up listener for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
        } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Sign up function
  const signUp = async (email, password, role, userData) => {
    setIsLoading(true);
    try {
      const { signUp } = await import('../api/authService');
      const result = await signUp(email, password, role, userData);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    setIsLoading(true);
    try {
      const { signIn } = await import('../api/authService');
      const result = await signIn(email, password);
      return result;
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    try {
      const { signOut } = await import('../api/authService');
      await signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is an admin
  const isAdmin = () => {
    return profile?.role === USER_ROLES.ADMIN;
  };

  // Check if user is a business owner
  const isBusinessOwner = () => {
    return profile?.role === USER_ROLES.BUSINESS_OWNER;
  };

  // Check if user is a normal user
  const isNormalUser = () => {
    return profile?.role === USER_ROLES.NORMAL_USER;
  };

  const contextValue = {
    user,
    profile,
    isLoading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isBusinessOwner,
    isNormalUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};