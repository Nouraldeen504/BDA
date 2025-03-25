import React from 'react';
import ProfileScreen from '../user/ProfileScreen';

// Reuse the regular profile screen for business owners
const BusinessOwnerProfileScreen = (props) => {
  return <ProfileScreen {...props} />;
};

export default BusinessOwnerProfileScreen;