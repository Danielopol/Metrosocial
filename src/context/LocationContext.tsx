import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Location } from '../types';
import { useAuth } from './AuthContext';
import { useOnline } from './OnlineContext';

interface NearbyUser {
  id: string;
  userId?: string; // Added for API compatibility - some responses use userId instead of id
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  location: Location;
  distance: number; // meters
}

interface LocationContextProps {
  userLocation: Location;
  setUserLocation: (loc: Location) => void;
  nearbyUsers: NearbyUser[];
  refreshNearbyUsers: () => Promise<NearbyUser[]>;
  getNearbyUserIds: () => string[];
}

const LocationContext = createContext<LocationContextProps | undefined>(undefined);

// API URL - Dynamic based on current host
const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  } else {
    // Use the same IP as the frontend but port 5000 for backend
    return `http://${hostname}:5000/api`;
  }
};

const API_URL = getApiUrl();

// Helper: Haversine formula
// function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
//   const R = 6371e3; // meters
//   const toRad = (deg: number) => deg * Math.PI / 180;
//   const dLat = toRad(lat2 - lat1);
//   const dLon = toRad(lon2 - lon1);
//   const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
//             Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//             Math.sin(dLon/2) * Math.sin(dLon/2);
//   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
//   return R * c;
// }

// Generate a random location within radius (meters) of a center point
// function randomNearbyLocation(center: Location, radius: number): Location {
//   const r = radius / 111300; // ~meters per degree
//   const u = Math.random();
//   const v = Math.random();
//   const w = r * Math.sqrt(u);
//   const t = 2 * Math.PI * v;
//   const x = w * Math.cos(t);
//   const y = w * Math.sin(t);
//   return {
//     latitude: center.latitude + x,
//     longitude: center.longitude + y,
//     accuracy: 10,
//   };
// }

// Mock user data (could import from mockUsers.ts)
// const MOCK_USERS = [
//   { id: 'mock1', username: 'alice', name: 'Alice Johnson', avatar: '👩‍💻' },
//   { id: 'mock2', username: 'bob', name: 'Bob Smith', avatar: '👨‍🎨' },
//   { id: 'mock3', username: 'carol', name: 'Carol Lee', avatar: '👩‍🚀' },
//   { id: 'mock4', username: 'dave', name: 'Dave Kim', avatar: '👨‍🎓' },
//   { id: 'mock5', username: 'eve', name: 'Eve Martinez', avatar: '👩‍🎨' },
// ];

const DEFAULT_LOCATION: Location = {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  locationName: 'New York City',
};

export const LocationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const { isOnline } = useOnline();
  const [userLocation, setUserLocation] = useState<Location>(DEFAULT_LOCATION);
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);

  // Get user's current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setUserLocation(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Report location to server when user is online
  useEffect(() => {
    const reportLocation = async () => {
      if (!isOnline || !authState.user || !authState.isAuthenticated) return;
      
      try {
        console.log(`Reporting location: ${userLocation.latitude}, ${userLocation.longitude}`);
        
        await fetch(`${API_URL}/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.token}`
          },
          body: JSON.stringify({
            userId: authState.user.id,
            username: authState.user.username,
            avatar: authState.user.avatar,
            location: userLocation
          })
        });
      } catch (error) {
        console.error("Error reporting location:", error);
      }
    };

    // Report location immediately and then every 30 seconds
    if (isOnline && authState.isAuthenticated) {
      reportLocation();
      const interval = setInterval(reportLocation, 30000);
      return () => clearInterval(interval);
    }
  }, [isOnline, authState.isAuthenticated, authState.user, userLocation, authState.token]);

  // Fetch nearby users
  const refreshNearbyUsers = useCallback(async () => {
    if (!isOnline || !authState.user) {
      setNearbyUsers([]);
      return [];
    }
    
    try {
      console.log(`Refreshing nearby users from location: ${userLocation.latitude}, ${userLocation.longitude}`);
      
      const queryParams = new URLSearchParams({
        userId: authState.user.id,
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString(),
        radius: '5000' // Increased to 5km for testing
      });
      
      const response = await fetch(`${API_URL}/location/nearby?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`Found ${result.users?.length || 0} nearby users`);
        
        if (result.users) {
          result.users.forEach((user: NearbyUser) => {
            console.log(`Nearby user: ${user.username} (${user.userId || user.id}) at distance ${Math.round(user.distance)}m`);
          });
        }
        
        // Map the response to ensure both id and userId are present
        const normalizedUsers = (result.users || []).map((user: any) => ({
          ...user,
          id: user.id || user.userId,
          userId: user.userId || user.id
        }));
        
        setNearbyUsers(normalizedUsers);
        return normalizedUsers;
      }
    } catch (error) {
      console.error("Error fetching nearby users:", error);
      setNearbyUsers([]);
    }
    
    return [];
  }, [isOnline, authState.user, authState.token, userLocation]);

  // Get IDs of nearby users
  const getNearbyUserIds = useCallback(() => {
    return nearbyUsers.map(user => user.id);
  }, [nearbyUsers]);

  // Refresh nearby users when location changes or online status changes
  useEffect(() => {
    if (isOnline && authState.isAuthenticated) {
      refreshNearbyUsers();
      const interval = setInterval(refreshNearbyUsers, 15000);
      return () => clearInterval(interval);
    }
  }, [isOnline, userLocation, authState.isAuthenticated, refreshNearbyUsers]);

  return (
    <LocationContext.Provider value={{ 
      userLocation, 
      setUserLocation, 
      nearbyUsers, 
      refreshNearbyUsers,
      getNearbyUserIds
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within a LocationProvider');
  return ctx;
}; 