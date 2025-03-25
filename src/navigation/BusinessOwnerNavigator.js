import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import business owner screens
import DashboardScreen from '../screens/business-owner/DashboardScreen';
import BusinessesListScreen from '../screens/business-owner/BusinessesListScreen';
import BusinessDetailsScreen from '../screens/business-owner/BusinessDetailsScreen';
import BusinessFormScreen from '../screens/business-owner/BusinessFormScreen';
import DealsListScreen from '../screens/business-owner/DealsListScreen';
import DealDetailsScreen from '../screens/business-owner/DealDetailsScreen';
import CreateDealScreen from '../screens/business-owner/CreateDealScreen';
import ReviewsListScreen from '../screens/business-owner/ReviewsListScreen';
import BusinessOwnerProfileScreen from '../screens/business-owner/BusinessOwnerProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Dashboard stack
const DashboardStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f9fa',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Business Dashboard' }}
      />
      <Stack.Screen 
        name="BusinessDetails" 
        component={BusinessDetailsScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Business Details' })}
      />
      <Stack.Screen 
        name="BusinessForm" 
        component={BusinessFormScreen} 
        options={({ route }) => ({ 
          title: route.params?.businessId ? 'Edit Business' : 'Add Business' 
        })}
      />
      <Stack.Screen 
        name="DealDetails" 
        component={DealDetailsScreen} 
        options={{ title: 'Deal Details' }}
      />
      <Stack.Screen 
        name="CreateDeal" 
        component={CreateDealScreen} 
        options={({ route }) => ({ 
          title: route.params?.dealId ? 'Edit Deal' : 'Create Deal' 
        })}
      />
      <Stack.Screen 
        name="BusinessesList" 
        component={BusinessesListScreen} 
        options={{ title: 'My Businesses' }}
      />
      <Stack.Screen 
        name="DealsList" 
        component={DealsListScreen} 
        options={{ title: 'My Deals' }}
      />
      <Stack.Screen 
        name="ReviewsList" 
        component={ReviewsListScreen} 
        options={{ title: 'Customer Reviews' }}
      />
    </Stack.Navigator>
  );
};

// Businesses stack
const BusinessesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f9fa',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="BusinessesList" 
        component={BusinessesListScreen} 
        options={{ title: 'My Businesses' }}
      />
      <Stack.Screen 
        name="BusinessDetails" 
        component={BusinessDetailsScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Business Details' })}
      />
      <Stack.Screen 
        name="BusinessForm" 
        component={BusinessFormScreen} 
        options={({ route }) => ({ 
          title: route.params?.businessId ? 'Edit Business' : 'Add Business' 
        })}
      />
      <Stack.Screen 
        name="ReviewsList" 
        component={ReviewsListScreen} 
        options={{ title: 'Customer Reviews' }}
      />
    </Stack.Navigator>
  );
};

// Deals stack
const DealsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f9fa',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="DealsList" 
        component={DealsListScreen} 
        options={{ title: 'My Deals' }}
      />
      <Stack.Screen 
        name="DealDetails" 
        component={DealDetailsScreen} 
        options={{ title: 'Deal Details' }}
      />
      <Stack.Screen 
        name="CreateDeal" 
        component={CreateDealScreen} 
        options={({ route }) => ({ 
          title: route.params?.dealId ? 'Edit Deal' : 'Create Deal' 
        })}
      />
      <Stack.Screen 
        name="BusinessDetails" 
        component={BusinessDetailsScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Business Details' })}
      />
    </Stack.Navigator>
  );
};

// Profile stack
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f8f9fa',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="BusinessOwnerProfile" 
        component={BusinessOwnerProfileScreen} 
        options={{ title: 'My Profile' }}
      />
    </Stack.Navigator>
  );
};

// Main business owner navigator with bottom tabs
const BusinessOwnerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'BusinessesTab') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'DealsTab') {
            iconName = focused ? 'pricetag' : 'pricetag-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="DashboardTab" 
        component={DashboardStack} 
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="BusinessesTab" 
        component={BusinessesStack} 
        options={{ title: 'Businesses' }}
      />
      <Tab.Screen 
        name="DealsTab" 
        component={DealsStack} 
        options={{ title: 'Deals' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default BusinessOwnerNavigator;