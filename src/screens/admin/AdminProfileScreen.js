import React from 'react';
import ProfileScreen from '../user/ProfileScreen';

// Reuse the regular profile screen for admins
const AdminProfileScreen = (props) => {
  return <ProfileScreen {...props} />;
};

export default AdminProfileScreen;