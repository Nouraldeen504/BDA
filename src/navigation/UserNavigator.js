import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import HomeScreen from '../screens/user/HomeScreen';
import SearchScreen from '../screens/user/SearchScreen';
import BusinessDetailScreen from '../screens/user/BusinessDetailScreen';
import ReviewScreen from '../screens/user/ReviewScreen';
import BookmarksScreen from '../screens/user/BookmarksScreen';
import DealsScreen from '../screens/user/DealsScreen';
import ProfileScreen from '../screens/user/ProfileScreen';
import MapScreen from '../screens/user/MapScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home stack navigator
const HomeStack = () => {
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
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Local Businesses' }}
      />
      <Stack.Screen 
        name="BusinessDetail" 
        component={BusinessDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Business Details' })}
      />
      <Stack.Screen 
        name="Review" 
        component={ReviewScreen} 
        options={{ title: 'Write a Review' }}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Directions' }}
      />
    </Stack.Navigator>
  );
};

// Search stack navigator
const SearchStack = () => {
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
        name="Search" 
        component={SearchScreen} 
        options={{ title: 'Search Businesses' }}
      />
      <Stack.Screen 
        name="BusinessDetail" 
        component={BusinessDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Business Details' })}
      />
      <Stack.Screen 
        name="Review" 
        component={ReviewScreen} 
        options={{ title: 'Write a Review' }}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Directions' }}
      />
    </Stack.Navigator>
  );
};

// Bookmarks stack navigator
const BookmarksStack = () => {
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
        name="Bookmarks" 
        component={BookmarksScreen} 
        options={{ title: 'My Bookmarks' }}
      />
      <Stack.Screen 
        name="BusinessDetail" 
        component={BusinessDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Business Details' })}
      />
      <Stack.Screen 
        name="Review" 
        component={ReviewScreen} 
        options={{ title: 'Write a Review' }}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Directions' }}
      />
    </Stack.Navigator>
  );
};

// Deals stack navigator
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
        name="Deals" 
        component={DealsScreen} 
        options={{ title: 'Special Deals' }}
      />
      <Stack.Screen 
        name="BusinessDetail" 
        component={BusinessDetailScreen} 
        options={({ route }) => ({ title: route.params?.name || 'Business Details' })}
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Directions' }}
      />
    </Stack.Navigator>
  );
};

// Profile stack navigator
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
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
    </Stack.Navigator>
  );
};

// Main tab navigator for normal users
const UserNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'SearchTab') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'BookmarksTab') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
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
        name="HomeTab" 
        component={HomeStack} 
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchStack} 
        options={{ title: 'Search' }}
      />
      <Tab.Screen 
        name="BookmarksTab" 
        component={BookmarksStack} 
        options={{ title: 'Bookmarks' }}
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

export default UserNavigator;