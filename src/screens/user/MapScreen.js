import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { getBusinessById } from '../../api/businessService';

const MapScreen = ({ route, navigation }) => {
  const { businessId, address } = route.params;
  const [business, setBusiness] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef(null);

  // Load business data and coordinates
  useEffect(() => {
    const fetchBusinessAndLocation = async () => {
      try {
        // Load business details if business ID is provided
        if (businessId) {
          const businessData = await getBusinessById(businessId);
          setBusiness(businessData);
          
          // Use business address for geocoding
          await geocodeAddress(businessData.address);
        } else if (address) {
          // Use provided address directly
          await geocodeAddress(address);
        } else {
          throw new Error('No business ID or address provided');
        }
        
        // Get user's current location
        await getUserLocation();
      } catch (error) {
        console.error('Error loading map data:', error);
        Alert.alert(
          'Error',
          'Failed to load location data. Please check your connection and try again.'
        );
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessAndLocation();
  }, [businessId, address]);

  // Get user's current location
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required to show your position on the map.'
        );
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Error getting user location:', error);
      Alert.alert('Error', 'Failed to get your current location.');
    }
  };

  // Geocode address to coordinates
  const geocodeAddress = async (addressToGeocode) => {
    if (!addressToGeocode) {
      throw new Error('Address is required for directions');
    }
    
    try {
      const results = await Location.geocodeAsync(addressToGeocode);
      
      if (results.length === 0) {
        throw new Error('Could not find coordinates for this address');
      }
      
      setDestinationCoords({
        latitude: results[0].latitude,
        longitude: results[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to convert address to coordinates');
    }
  };

  // Handle map ready event
  const handleMapReady = () => {
    setMapReady(true);
    fitMapToMarkers();
  };

  // Fit map to show all markers
  const fitMapToMarkers = () => {
    if (mapRef.current && mapReady && userLocation && destinationCoords) {
      mapRef.current.fitToSuppliedMarkers(['user', 'destination'], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  // Open in external maps app
  const openInMapsApp = () => {
    if (!destinationCoords) return;
    
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    
    const latLng = `${destinationCoords.latitude},${destinationCoords.longitude}`;
    const label = business ? business.name : 'Destination';
    
    const url = Platform.select({
      ios: `${scheme}?q=${label}&ll=${latLng}`,
      android: `${scheme}0,0?q=${latLng}(${label})`,
    });
    
    Linking.openURL(url);
  };

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={destinationCoords || userLocation}
        onMapReady={handleMapReady}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {userLocation && (
          <Marker
            identifier="user"
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Your Location"
            pinColor="#007bff"
          />
        )}
        
        {destinationCoords && (
          <Marker
            identifier="destination"
            coordinate={{
              latitude: destinationCoords.latitude,
              longitude: destinationCoords.longitude,
            }}
            title={business ? business.name : 'Destination'}
            description={business ? business.address : address}
          />
        )}
      </MapView>

      {/* Info panel */}
      <View style={styles.infoPanel}>
        <View style={styles.infoContent}>
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationTitle}>
              {business ? business.name : 'Destination'}
            </Text>
            <Text style={styles.destinationAddress}>
              {business ? business.address : address}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={openInMapsApp}
          >
            <Ionicons name="navigate" size={20} color="#fff" />
            <Text style={styles.directionsButtonText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  map: {
    flex: 1,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: 16,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  destinationInfo: {
    flex: 1,
    marginRight: 16,
  },
  destinationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  destinationAddress: {
    fontSize: 14,
    color: '#666',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  directionsButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 4,
  },
});

export default MapScreen;