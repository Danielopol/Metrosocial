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

// API URL
const API_URL = 'http://localhost:5000/api';

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
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setAuthState({
            ...authState,
            loading: false
          });
          return;
        }
        
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setAuthState({
            user: data.user,
            token,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        } else {
          // If token is invalid, clear localStorage
          localStorage.removeItem('token');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });
        }
      } catch (error) {
        setAuthState({
          ...authState,
          loading: false,
          error: 'Authentication error'
        });
      }
    };
    
    checkAuthStatus();
  }, []);

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
  const logout = () => {
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
    try {
      setAuthState({
        ...authState,
        loading: true,
        error: null
      });
      
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Profile update failed');
      }
      
      setAuthState({
        ...authState,
        user: result.user,
        loading: false
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