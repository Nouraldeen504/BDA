import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUsers, updateUserStatus } from '../../api/adminService';
import { USER_ROLES } from '../../api/authService';

const UserManagementScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleFilter, setRoleFilter] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deactivationReason, setDeactivationReason] = useState('');

  // Load users on mount
  useEffect(() => {
    fetchUsers(1, true);
  }, [roleFilter]);

  // Fetch users
  const fetchUsers = async (pageNum, reset = false) => {
    if (reset) {
      setIsLoading(true);
    }

    try {
      const filters = { role: roleFilter };
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await getUsers(filters, pageNum);
      
      if (reset) {
        setUsers(response.users);
        setFilteredUsers(response.users);
      } else {
        setUsers([...users, ...response.users]);
        setFilteredUsers([...filteredUsers, ...response.users]);
      }
      
      setTotalUsers(response.total);
      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers(1, true);
  };

  // Handle search
  const handleSearch = () => {
    fetchUsers(1, true);
  };

  // Load more users when reaching end of list
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchUsers(page + 1);
    }
  };

  // Toggle role filter
  const handleRoleFilter = (role) => {
    setRoleFilter(role === roleFilter ? null : role);
  };

  // View user details
  const handleViewUser = (user) => {
    navigation.navigate('UserDetails', { userId: user.id, name: user.display_name || user.email });
  };

  // Show deactivation modal
  const handleShowDeactivateModal = (user) => {
    setSelectedUser(user);
    setDeactivationReason('');
    setModalVisible(true);
  };

  // Handle user deactivation
  const handleDeactivateUser = async () => {
    if (!deactivationReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for deactivation.');
      return;
    }
    
    setModalVisible(false);
    setIsLoading(true);
    
    try {
      await updateUserStatus(selectedUser.id, false, deactivationReason);
      
      // Update local state
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? { ...user, is_active: false } : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      
      Alert.alert('Success', `User "${selectedUser.display_name || selectedUser.email}" has been deactivated.`);
    } catch (error) {
      console.error('Error deactivating user:', error);
      Alert.alert('Error', 'Failed to deactivate user.');
    } finally {
      setIsLoading(false);
      setSelectedUser(null);
    }
  };

  // Handle user reactivation
  const handleReactivateUser = async (user) => {
    Alert.alert(
      'Reactivate User',
      `Are you sure you want to reactivate user "${user.display_name || user.email}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reactivate',
          onPress: async () => {
            setIsLoading(true);
            try {
              await updateUserStatus(user.id, true);
              
              // Update local state
              const updatedUsers = users.map(u => 
                u.id === user.id ? { ...u, is_active: true } : u
              );
              setUsers(updatedUsers);
              setFilteredUsers(updatedUsers);
              
              Alert.alert('Success', `User "${user.display_name || user.email}" has been reactivated.`);
            } catch (error) {
              console.error('Error reactivating user:', error);
              Alert.alert('Error', 'Failed to reactivate user.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return '#dc3545';
      case USER_ROLES.BUSINESS_OWNER:
        return '#28a745';
      case USER_ROLES.NORMAL_USER:
      default:
        return '#007bff';
    }
  };

  // Format role display name
  const formatRoleName = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'Admin';
      case USER_ROLES.BUSINESS_OWNER:
        return 'Business Owner';
      case USER_ROLES.NORMAL_USER:
        return 'User';
      default:
        return role;
    }
  };

  // Render footer (loading indicator for pagination)
  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#007bff" />
        <Text style={styles.loadingMoreText}>Loading more users...</Text>
      </View>
    );
  };

  // Render user item
  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.userCard, !item.is_active && styles.inactiveUserCard]}
      onPress={() => handleViewUser(item)}
    >
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.userName}>{item.display_name || item.email}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.role) }]}>
          <Text style={styles.roleText}>{formatRoleName(item.role)}</Text>
        </View>
      </View>
      
      <View style={styles.userMeta}>
        <Text style={styles.userMetaText}>
          Created: {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <Text style={[styles.userStatus, item.is_active ? styles.activeStatus : styles.inactiveStatus]}>
          {item.is_active ? 'Active' : 'Inactive'}
        </Text>
      </View>
      
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleViewUser(item)}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>View</Text>
        </TouchableOpacity>
        
        {item.is_active ? (
          <TouchableOpacity
            style={styles.deactivateButton}
            onPress={() => handleShowDeactivateModal(item)}
          >
            <Ionicons name="person-remove-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Deactivate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.reactivateButton}
            onPress={() => handleReactivateUser(item)}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Reactivate</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Role Filters */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter === null && styles.activeFilterButton
          ]}
          onPress={() => handleRoleFilter(null)}
        >
          <Text style={[
            styles.filterButtonText,
            roleFilter === null && styles.activeFilterText
          ]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter === USER_ROLES.NORMAL_USER && styles.activeFilterButton
          ]}
          onPress={() => handleRoleFilter(USER_ROLES.NORMAL_USER)}
        >
          <Text style={[
            styles.filterButtonText,
            roleFilter === USER_ROLES.NORMAL_USER && styles.activeFilterText
          ]}>
            Users
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter === USER_ROLES.BUSINESS_OWNER && styles.activeFilterButton
          ]}
          onPress={() => handleRoleFilter(USER_ROLES.BUSINESS_OWNER)}
        >
          <Text style={[
            styles.filterButtonText,
            roleFilter === USER_ROLES.BUSINESS_OWNER && styles.activeFilterText
          ]}>
            Business Owners
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            roleFilter === USER_ROLES.ADMIN && styles.activeFilterButton
          ]}
          onPress={() => handleRoleFilter(USER_ROLES.ADMIN)}
        >
          <Text style={[
            styles.filterButtonText,
            roleFilter === USER_ROLES.ADMIN && styles.activeFilterText
          ]}>
            Admins
          </Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      {isLoading && users.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListHeaderComponent={() => (
            <Text style={styles.resultCount}>
              Showing {filteredUsers.length} of {totalUsers} users
            </Text>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color="#ccc" />
          <Text style={styles.emptyTitle}>No Users Found</Text>
          <Text style={styles.emptyText}>
            Try adjusting your search criteria.
          </Text>
        </View>
      )}

      {/* Deactivation Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Deactivate User</Text>
            
            <Text style={styles.modalSubtitle}>
              Please provide a reason for deactivating user "{selectedUser?.display_name || selectedUser?.email}":
            </Text>
            
            <TextInput
              style={styles.modalInput}
              value={deactivationReason}
              onChangeText={setDeactivationReason}
              placeholder="Enter reason for deactivation"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleDeactivateUser}
              >
                <Text style={styles.modalConfirmText}>Confirm Deactivation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filtersContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  filterButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeFilterButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  filterButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 12,
  },
  activeFilterText: {
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  resultCount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  inactiveUserCard: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userMetaText: {
    fontSize: 12,
    color: '#888',
  },
  userStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatus: {
    color: '#28a745',
  },
  inactiveStatus: {
    color: '#dc3545',
  },
  userActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  reactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
    fontSize: 14,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingMoreText: {
    color: '#666',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 12,
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  modalConfirmButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default UserManagementScreen;