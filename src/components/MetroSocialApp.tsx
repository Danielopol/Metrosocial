import React, { useState } from 'react';
import { Users, User } from 'lucide-react';
import UserProfileIndicator from './UserProfileIndicator';
import { useOnline } from '../context/OnlineContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { Profile } from './auth';
import CreatePost from './social/CreatePost';
import ProximityLayers from './social/ProximityLayers';
import { ProximityUser } from '../types';

const MetroSocialApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const { isOnline, toggleOnlineStatus } = useOnline();
  const [showProfile, setShowProfile] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { authState } = useAuth();
  const { nearbyUsers } = useLocation();

  // Transform nearby users to proximity users
  const transformToProximityUsers = (users: any[]): ProximityUser[] => {
    return users.map((user: any) => ({
      id: user.id || user.userId,
      username: user.username,
      avatar: user.avatar || '👤',
      distance: user.distance,
      zone: user.distance <= 10 ? 'intimate' : 
            user.distance <= 50 ? 'personal' : 
            user.distance <= 200 ? 'social' : 'public',
      status: 'online' as const,
      location: {
        lat: user.location?.latitude || 0,
        lng: user.location?.longitude || 0
      },
      name: user.name,
      bio: user.bio
    }));
  };

  // Handle user click from proximity layers
  const handleUserClick = (userId: string) => {
    console.log('User clicked:', userId);
    // TODO: Implement user profile viewing or chat initiation
  };

  // Handle create post from proximity layers
  const handleCreatePost = () => {
    setShowCreatePost(true);
  };

  // Render current screen
  const renderScreen = () => {
    if (currentScreen === 'home') {
      return (
        <div className="min-h-screen bg-gray-50">
          {/* Top Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-2xl mx-auto px-4 py-3">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900">MetroSocial</h1>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {isOnline && authState.user ? (
            // Full-screen proximity layers with feed overlay
            <div className="h-[calc(100vh-4rem)] relative">
              <ProximityLayers
                nearbyUsers={transformToProximityUsers(nearbyUsers)}
                currentUser={authState.user}
                onUserClick={handleUserClick}
                onCreatePost={handleCreatePost}
              />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <UserProfileIndicator />
              
              <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                    <Users size={40} className="text-gray-400"/>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">
                    Connect with people nearby
                  </h2>
                  <p className="text-gray-500 mb-6 leading-relaxed">
                    Go online to post and see what people around you are sharing. 
                    Discover your local community on MetroSocial.
                  </p>
                  <button 
                    className="bg-blue-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-blue-600 transition-colors"
                    onClick={toggleOnlineStatus}
                  >
                    Go Online
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    // Profile modal and nav bar remain unchanged
  };

  // Bottom navigation bar (only show when offline or in other screens)
  const renderNavBar = () => {
    if (currentScreen === 'home' && isOnline) {
      return null; // Hide nav bar when using proximity layers
    }

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-center py-2 z-20">
        <button 
          className="flex flex-col items-center w-1/3 py-2"
          onClick={() => setCurrentScreen('home')}
        >
          <Users size={24} className="text-blue-500"/>
          <span className="text-xs mt-1 text-blue-500 font-medium">Feed</span>
        </button>
        <button 
          className="flex flex-col items-center w-1/3 py-2"
          onClick={() => setShowProfile(true)}
        >
          <User size={24} className={`${showProfile ? 'text-blue-500' : 'text-gray-400'}`}/>
          <span className={`text-xs mt-1 font-medium ${showProfile ? 'text-blue-500' : 'text-gray-400'}`}>
            Profile
          </span>
        </button>
      </div>
    );
  };

  // Profile Modal
  const renderProfileModal = () => {
    if (!showProfile) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex items-start justify-center p-4 overflow-y-auto pt-10">
        <div className="w-full max-w-md mb-10">
          <Profile onClose={() => setShowProfile(false)} />
        </div>
      </div>
    );
  };

  // Create Post Modal
  const renderCreatePostModal = () => {
    if (!showCreatePost) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-lg">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-semibold">Create Post</h2>
            <button 
              onClick={() => setShowCreatePost(false)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          <CreatePost />
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 pb-20">
        {renderScreen()}
      </div>
      {renderNavBar()}
      {renderProfileModal()}
      {renderCreatePostModal()}
    </div>
  );
};

export default MetroSocialApp; 