import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AuthScreen from './AuthScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authState } = useAuth();
  
  // Show loading state
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // If not authenticated, show auth screen
  if (!authState.isAuthenticated) {
    return <AuthScreen />;
  }
  
  // If authenticated, show the children components
  return <>{children}</>;
};

export default ProtectedRoute; 