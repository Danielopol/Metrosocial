import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

interface AuthScreenProps {
  onClose?: () => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  
  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        {onClose && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">MetroSocial</h1>
          <p className="text-gray-600">Connect with people around you</p>
        </div>
        
        {isLogin ? (
          <Login onToggleForm={toggleForm} />
        ) : (
          <Register onToggleForm={toggleForm} />
        )}
      </div>
    </div>
  );
};

export default AuthScreen; 