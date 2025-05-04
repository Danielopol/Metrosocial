import React from 'react';
import './App.css';
import MetroSocialApp from './components/MetroSocialApp';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <div className="relative">
          {/* Main App with Protected Route */}
          <ProtectedRoute>
            <MetroSocialApp />
          </ProtectedRoute>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App; 