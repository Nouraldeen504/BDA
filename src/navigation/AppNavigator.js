import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';

// Import navigation stacks
import AuthNavigator from './AuthNavigator';
import UserNavigator from './UserNavigator';
import BusinessOwnerNavigator from './BusinessOwnerNavigator';
import AdminNavigator from './AdminNavigator';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user, isAdmin, isBusinessOwner } = useAuth();

  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        presentation: 'modal' 
      }}
    >
      {user ? (
        // User is authenticated, show appropriate navigator based on role
        isAdmin() ? (
          <Stack.Screen name="AdminRoot" component={AdminNavigator} />
        ) : isBusinessOwner() ? (
          <Stack.Screen name="BusinessOwnerRoot" component={BusinessOwnerNavigator} />
        ) : (
          <Stack.Screen name="UserRoot" component={UserNavigator} />
        )
      ) : (
        // User is not authenticated, show auth screens
        <Stack.Screen name="AuthRoot" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;