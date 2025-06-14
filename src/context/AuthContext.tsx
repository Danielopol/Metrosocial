import axios from 'axios';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthState, LoginFormData, RegisterFormData } from '../types';

interface AuthContextProps {
  authState: AuthState;
  login: (data: LoginFormData) => Promise<void>;
  register: (data: RegisterFormData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

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

interface VerifyResponse {
  user: AuthUser;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: true,
    error: null
  });

  // Check if user is already logged in (token exists)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          console.log('Found token in localStorage, verifying...');
          // Verify token with backend
          const response = await axios.get<VerifyResponse>(
            `${API_URL}/auth/verify`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log('Token verification successful');
          setAuthState(prevState => ({
            ...prevState,
            isAuthenticated: true,
            token: token,
            user: response.data.user,
            loading: false,
            error: null,
          }));
        } else {
          console.log('No token found in localStorage');
          setAuthState(prevState => ({
            ...prevState,
            isAuthenticated: false,
            token: null,
            user: null,
            loading: false,
            error: null,
          }));
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        console.log('Clearing invalid token from localStorage');
        localStorage.removeItem("token");
        setAuthState(prevState => ({
            ...prevState,
            isAuthenticated: false,
            token: null,
            user: null,
            loading: false,
            error: null, // Don't show error for expired tokens on app load
        }));
      } finally {
        // Ensure loading is set to false if it hasn't been already
        setAuthState(prevState => ({
          ...prevState,
          loading: false
        }));
      }
    };
    checkAuth();
  }, []); // Removed authState from dependencies to avoid re-triggering on its own update

  // Login user
  const login = async (data: LoginFormData) => {
    try {
      setAuthState({
        ...authState,
        loading: true,
        error: null
      });
      
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Login failed');
      }
      
      localStorage.setItem('token', result.token);
      
      setAuthState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setAuthState({
        ...authState,
        loading: false,
        error: error.message
      });
      throw error;
    }
  };

  // Register user
  const register = async (data: RegisterFormData) => {
    try {
      setAuthState({
        ...authState,
        loading: true,
        error: null
      });
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
      
      localStorage.setItem('token', result.token);
      
      setAuthState({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        loading: false,
        error: null
      });
    } catch (error: any) {
      setAuthState({
        ...authState,
        loading: false,
        error: error.message
      });
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    if (authState.token) {
      try {
        await fetch(`${API_URL}/users/offline`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.token}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (e) {
        // Ignore errors
      }
    }
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  };

  // Update user profile
  const updateProfile = async (data: Partial<AuthUser>) => {
    console.log('==== AUTH CONTEXT UPDATE PROFILE ====');
    try {
      console.log('Current auth state:', JSON.stringify({
        isAuthenticated: authState.isAuthenticated,
        hasToken: !!authState.token,
        userId: authState.user?.id,
        username: authState.user?.username
      }));
      
      // Check if we have a valid token
      if (!authState.token) {
        throw new Error('No authentication token available. Please log in again.');
      }
      
      setAuthState(prevState => ({
        ...prevState,
        loading: true,
        error: null
      }));
      
      // Ensure we have the avatar properly formatted
      const profileData = {
        ...data,
        // Send the avatar value from the form data directly
        // If data.avatar is null/undefined/empty, it will be sent as such
        avatar: data.avatar 
      };
      
      // Log the avatar type for debugging
      if (profileData.avatar) {
        const avatarType = typeof profileData.avatar === 'string' && 
          profileData.avatar.startsWith('data:image/') ? 'image' : 'emoji';
        console.log(`Updating profile with avatar type: ${avatarType}`);
      }

      console.log("Sending profile update:", JSON.stringify({
        ...profileData,
        avatar: profileData.avatar ? 'Avatar data exists' : 'No avatar'
      }));
      
      console.log('HTTP request details:');
      console.log('URL:', `${API_URL}/users/profile`);
      console.log('Method:', 'PUT');
      console.log('Headers:', JSON.stringify({
        'Content-Type': 'application/json',
        'Authorization': authState.token ? 'Bearer [token exists]' : 'none',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }));
      
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(profileData)
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', JSON.stringify(result));
      
      if (!response.ok) {
        // If token is invalid/expired, automatically logout
        if (response.status === 401) {
          console.log('Token expired or invalid - logging out user');
          logout();
          throw new Error('Your session has expired. Please log in again.');
        }
        throw new Error(result.message || 'Profile update failed');
      }
      
      console.log('Profile updated successfully:', result);
      
      // Use the user data from the response to update the auth state
      setAuthState(prevState => ({
        ...prevState,
        user: result.user,
        loading: false,
        error: null
      }));
      
      console.log('Auth state updated with new user data');
      
      // Dispatch events for UI updates
      window.dispatchEvent(new Event('avatarUpdated'));
      window.dispatchEvent(new Event('profileUpdated'));
      console.log('Dispatched avatarUpdated and profileUpdated events');
      
    } catch (error: any) {
      console.error('Profile update failed:', error.message);
      setAuthState(prevState => ({
        ...prevState,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ authState, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 