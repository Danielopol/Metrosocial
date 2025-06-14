import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface OnlineContextProps {
  isOnline: boolean;
  toggleOnlineStatus: () => void;
}

const OnlineContext = createContext<OnlineContextProps | undefined>(undefined);

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

export const OnlineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Start offline by default
  const [isOnline, setIsOnline] = useState(false);
  const { authState } = useAuth();

  // Update online status on the server
  const updateServerOnlineStatus = async (status: boolean) => {
    if (!authState.token) return;
    
    try {
      console.log(`Setting user ${status ? 'online' : 'offline'} on server`);
      const endpoint = status ? `${API_URL}/users/online` : `${API_URL}/users/offline`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authState.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log(`Successfully set user ${status ? 'online' : 'offline'}`);
      } else {
        console.error(`Failed to set user ${status ? 'online' : 'offline'}`);
      }
    } catch (error) {
      console.error(`Error setting user ${status ? 'online' : 'offline'}:`, error);
    }
  };

  // Restore online status from localStorage on initial load
  useEffect(() => {
    const storedOnlineStatus = localStorage.getItem('metrosocial_online_status');
    if (storedOnlineStatus) {
      const status = storedOnlineStatus === 'true';
      setIsOnline(status);
      
      // If we're supposed to be online and we have a token, tell the server
      if (status && authState.token) {
        updateServerOnlineStatus(true);
      }
    }
  }, [authState.token]);

  // Save online status to localStorage on change and update server
  useEffect(() => {
    localStorage.setItem('metrosocial_online_status', isOnline.toString());
    
    // Update server when online status changes (but only if we have a token)
    if (authState.token) {
      updateServerOnlineStatus(isOnline);
    }
  }, [isOnline, authState.token]);
  
  // Make sure we're set offline when unmounting
  useEffect(() => {
    return () => {
      if (isOnline && authState.token) {
        updateServerOnlineStatus(false);
      }
    };
  }, [isOnline, authState.token]);

  const toggleOnlineStatus = async () => {
    setIsOnline(prev => !prev);
  };

  return (
    <OnlineContext.Provider
      value={{
        isOnline,
        toggleOnlineStatus
      }}
    >
      {children}
    </OnlineContext.Provider>
  );
};

// Custom hook to use the online context
export const useOnline = () => {
  const context = useContext(OnlineContext);
  if (context === undefined) {
    throw new Error('useOnline must be used within an OnlineProvider');
  }
  return context;
}; 