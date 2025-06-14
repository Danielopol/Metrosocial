import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfileIndicator: React.FC = () => {
  const { authState } = useAuth();
  const [avatarKey, setAvatarKey] = useState(0);
  
  // Force re-render when user avatar changes
  useEffect(() => {
    if (authState.user?.avatar) {
      setAvatarKey(prev => prev + 1);
    }
  }, [authState.user?.avatar]);
  
  // Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdated = () => {
      console.log('Avatar updated event received');
      setAvatarKey(prev => prev + 1);
    };
    
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
    };
  }, []);
  
  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  const isImageAvatar = typeof authState.user.avatar === 'string' && 
    authState.user.avatar.startsWith('data:image/');
  
  return (
    <div className="user-profile-indicator bg-white shadow-sm border border-gray-100 rounded-lg p-4 mb-4 mx-4">
      {/* Left-aligned profile layout */}
      <div className="flex items-center space-x-4">
        {/* Avatar on the far left */}
        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
          {isImageAvatar ? (
            <div 
              key={`profile-indicator-${avatarKey}`}
              className="w-full h-full"
              style={{
                backgroundImage: `url("${authState.user.avatar}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          ) : (
            authState.user.avatar || '👤'
          )}
        </div>
        
        {/* Profile text - aligned to the left side */}
        <div className="flex-1 text-left">
          {/* Name - left aligned */}
          <h3 className="text-lg font-bold text-gray-900 leading-tight text-left">
            {authState.user.name}
          </h3>
          
          {/* Handle - left aligned */}
          <p className="text-gray-500 text-sm text-left">
            @{authState.user.username}
          </p>
          
          {/* Bio - left aligned */}
          {authState.user.bio && (
            <p className="text-gray-700 text-sm leading-relaxed mt-1 text-left">
              {authState.user.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileIndicator; 