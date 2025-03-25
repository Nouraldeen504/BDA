import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getDashboardAnalytics } from '../../api/adminService';

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - 24;

const AdminDashboardScreen = ({ navigation }) => {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load analytics data on mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setError(null);
    
    try {
      const analyticsData = await getDashboardAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.adminName}>{profile?.display_name || 'Admin'}</Text>
        </View>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
        </View>
      </View>

      {/* Error message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.quickActionsContainer}>
        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('BusinessVerification')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="business-outline" size={24} color="#1976d2" />
          </View>
          <Text style={styles.quickActionTitle}>Business Verification</Text>
          {analytics && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{analytics.businessStats.pending}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('ReviewModeration')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="star-outline" size={24} color="#388e3c" />
          </View>
          <Text style={styles.quickActionTitle}>Review Moderation</Text>
          {analytics && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{analytics.reviewStats.pending}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('DealModeration')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#fff8e1' }]}>
            <Ionicons name="pricetag-outline" size={24} color="#ffa000" />
          </View>
          <Text style={styles.quickActionTitle}>Deal Moderation</Text>
          {analytics && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{analytics.dealStats.pending}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionCard}
          onPress={() => navigation.navigate('CategoryManagement')}
        >
          <View style={[styles.iconContainer, { backgroundColor: '#f3e5f5' }]}>
            <Ionicons name="list-outline" size={24} color="#7b1fa2" />
          </View>
          <Text style={styles.quickActionTitle}>Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Stats section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.userStats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.businessStats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Businesses</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.reviewStats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Reviews</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{analytics?.dealStats.total || 0}</Text>
            <Text style={styles.statLabel}>Total Deals</Text>
          </View>
        </View>
      </View>

      {/* Pending approvals */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Pending Approvals</Text>
        
        <View style={styles.pendingContainer}>
          <TouchableOpacity 
            style={styles.pendingCard}
            onPress={() => navigation.navigate('BusinessVerification')}
          >
            <View style={styles.pendingHeader}>
              <Ionicons name="business" size={20} color="#1976d2" />
              <Text style={styles.pendingTitle}>Businesses</Text>
            </View>
            <Text style={styles.pendingCount}>{analytics?.businessStats.pending || 0}</Text>
            <View style={styles.pendingFooter}>
              <Text style={styles.pendingAction}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#1976d2" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.pendingCard}
            onPress={() => navigation.navigate('ReviewModeration')}
          >
            <View style={styles.pendingHeader}>
              <Ionicons name="star" size={20} color="#388e3c" />
              <Text style={styles.pendingTitle}>Reviews</Text>
            </View>
            <Text style={styles.pendingCount}>{analytics?.reviewStats.pending || 0}</Text>
            <View style={styles.pendingFooter}>
              <Text style={styles.pendingAction}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#388e3c" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.pendingCard}
            onPress={() => navigation.navigate('DealModeration')}
          >
            <View style={styles.pendingHeader}>
              <Ionicons name="pricetag" size={20} color="#ffa000" />
              <Text style={styles.pendingTitle}>Deals</Text>
            </View>
            <Text style={styles.pendingCount}>{analytics?.dealStats.pending || 0}</Text>
            <View style={styles.pendingFooter}>
              <Text style={styles.pendingAction}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#ffa000" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent users */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Users</Text>
          <TouchableOpacity onPress={() => navigation.navigate('UserManagement')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        {analytics?.userStats.recent && analytics.userStats.recent.length > 0 ? (
          <View style={styles.recentUsersContainer}>
            {analytics.userStats.recent.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => navigation.navigate('UserDetails', { userId: user.id })}
              >
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.display_name || user.email}</Text>
                  <Text style={styles.userRole}>{user.role}</Text>
                </View>
                <Text style={styles.userDate}>
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No recent users to display</Text>
        )}
      </View>

      {/* Admin actions */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Admin Actions</Text>
        
        <View style={styles.adminActionsContainer}>
          <TouchableOpacity 
            style={styles.adminActionButton}
            onPress={() => navigation.navigate('UserManagement')}
          >
            <Ionicons name="people-outline" size={20} color="#fff" />
            <Text style={styles.adminActionText}>User Management</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.adminActionButton}
            onPress={() => navigation.navigate('SystemSettings')}
          >
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={styles.adminActionText}>System Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.adminActionButton}
            onPress={() => navigation.navigate('ActivityLogs')}
          >
            <Ionicons name="list-outline" size={20} color="#fff" />
            <Text style={styles.adminActionText}>Activity Logs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.adminActionButton}
            onPress={() => navigation.navigate('ReportGenerator')}
          >
            <Ionicons name="analytics-outline" size={20} color="#fff" />
            <Text style={styles.adminActionText}>Generate Reports</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  welcomeText: {
    fontSize: 14,
    color: '#666',
  },
  adminName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dateContainer: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    color: '#d32f2f',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  quickActionCard: {
    width: cardWidth,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f44336',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContainer: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e1e1e1',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  seeAllText: {
    color: '#007bff',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  pendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  pendingCard: {
    width: '31%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: '#333',
  },
  pendingCount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  pendingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingAction: {
    fontSize: 12,
    color: '#007bff',
    marginRight: 4,
  },
  recentUsersContainer: {
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  userDate: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  emptyText: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  adminActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  adminActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginBottom: 12,
    width: '48%',
  },
  adminActionText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});

export default AdminDashboardScreen;