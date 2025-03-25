import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import admin screens
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import BusinessVerificationScreen from '../screens/admin/BusinessVerificationScreen';
import BusinessDetailsScreen from '../screens/admin/BusinessDetailsScreen';
import ReviewModerationScreen from '../screens/admin/ReviewModerationScreen';
import DealModerationScreen from '../screens/admin/DealModerationScreen';
import CategoryManagementScreen from '../screens/admin/CategoryManagementScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import UserDetailsScreen from '../screens/admin/UserDetailsScreen';
import SystemSettingsScreen from '../screens/admin/SystemSettingsScreen';
import ActivityLogsScreen from '../screens/admin/ActivityLogsScreen';
import ReportGeneratorScreen from '../screens/admin/ReportGeneratorScreen';
import AdminProfileScreen from '../screens/admin/AdminProfileScreen';

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
        component={AdminDashboardScreen} 
        options={{ title: 'Admin Dashboard' }}
      />
      <Stack.Screen 
        name="BusinessVerification" 
        component={BusinessVerificationScreen} 
        options={{ title: 'Business Verification' }}
      />
      <Stack.Screen 
        name="BusinessDetails" 
        component={BusinessDetailsScreen} 
        options={({ route }) => ({ 
          title: route.params?.name || 'Business Details' 
        })}
      />
      <Stack.Screen 
        name="ReviewModeration" 
        component={ReviewModerationScreen} 
        options={{ title: 'Review Moderation' }}
      />
      <Stack.Screen 
        name="DealModeration" 
        component={DealModerationScreen} 
        options={{ title: 'Deal Moderation' }}
      />
      <Stack.Screen 
        name="CategoryManagement" 
        component={CategoryManagementScreen} 
        options={{ title: 'Category Management' }}
      />
      <Stack.Screen 
        name="UserManagement" 
        component={UserManagementScreen} 
        options={{ title: 'User Management' }}
      />
      <Stack.Screen 
        name="UserDetails" 
        component={UserDetailsScreen} 
        options={({ route }) => ({ 
          title: route.params?.name || 'User Details' 
        })}
      />
      <Stack.Screen 
        name="SystemSettings" 
        component={SystemSettingsScreen} 
        options={{ title: 'System Settings' }}
      />
      <Stack.Screen 
        name="ActivityLogs" 
        component={ActivityLogsScreen} 
        options={{ title: 'Activity Logs' }}
      />
      <Stack.Screen 
        name="ReportGenerator" 
        component={ReportGeneratorScreen} 
        options={{ title: 'Report Generator' }}
      />
    </Stack.Navigator>
  );
};

// Users stack
const UsersStack = () => {
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
        name="UserManagement" 
        component={UserManagementScreen} 
        options={{ title: 'User Management' }}
      />
      <Stack.Screen 
        name="UserDetails" 
        component={UserDetailsScreen} 
        options={({ route }) => ({ 
          title: route.params?.name || 'User Details' 
        })}
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
        name="BusinessVerification" 
        component={BusinessVerificationScreen} 
        options={{ title: 'Business Management' }}
      />
      <Stack.Screen 
        name="BusinessDetails" 
        component={BusinessDetailsScreen} 
        options={({ route }) => ({ 
          title: route.params?.name || 'Business Details' 
        })}
      />
      <Stack.Screen 
        name="CategoryManagement" 
        component={CategoryManagementScreen} 
        options={{ title: 'Category Management' }}
      />
    </Stack.Navigator>
  );
};

// Content stack
const ContentStack = () => {
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
        name="ContentManagement" 
        component={ReviewModerationScreen} 
        options={{ title: 'Content Management' }}
      />
      <Stack.Screen 
        name="ReviewModeration" 
        component={ReviewModerationScreen} 
        options={{ title: 'Review Moderation' }}
      />
      <Stack.Screen 
        name="DealModeration" 
        component={DealModerationScreen} 
        options={{ title: 'Deal Moderation' }}
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
        name="AdminProfile" 
        component={AdminProfileScreen} 
        options={{ title: 'Admin Profile' }}
      />
      <Stack.Screen 
        name="SystemSettings" 
        component={SystemSettingsScreen} 
        options={{ title: 'System Settings' }}
      />
      <Stack.Screen 
        name="ActivityLogs" 
        component={ActivityLogsScreen} 
        options={{ title: 'Activity Logs' }}
      />
      <Stack.Screen 
        name="ReportGenerator" 
        component={ReportGeneratorScreen} 
        options={{ title: 'Report Generator' }}
      />
    </Stack.Navigator>
  );
};

// Main admin navigator with bottom tabs
const AdminNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'UsersTab') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'BusinessesTab') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'ContentTab') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'settings' : 'settings-outline';
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
        name="UsersTab" 
        component={UsersStack} 
        options={{ title: 'Users' }}
      />
      <Tab.Screen 
        name="BusinessesTab" 
        component={BusinessesStack} 
        options={{ title: 'Businesses' }}
      />
      <Tab.Screen 
        name="ContentTab" 
        component={ContentStack} 
        options={{ title: 'Content' }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{ title: 'Admin' }}
      />
    </Tab.Navigator>
  );
};

export default AdminNavigator;