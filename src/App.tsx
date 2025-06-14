import React from 'react';
import './App.css';
import MetroSocialApp from './components/MetroSocialApp';
import { AuthProvider } from './context/AuthContext';
import { OnlineProvider } from './context/OnlineContext';
import { LocationProvider } from './context/LocationContext';
import { PostProvider } from './context/PostContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/auth';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <OnlineProvider>
          <LocationProvider>
            <PostProvider>
              <div className="App">
                <div className="relative">
                  {/* Main App with Protected Route */}
                  <ProtectedRoute>
                    <MetroSocialApp />
                  </ProtectedRoute>
                </div>
              </div>
            </PostProvider>
          </LocationProvider>
        </OnlineProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App; 