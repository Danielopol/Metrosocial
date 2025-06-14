import React, { useState, useEffect } from 'react';
import { useLocation } from '../../context/LocationContext';
import { User, MessageCircle, MapPin } from 'lucide-react';
import { useOnline } from '../../context/OnlineContext';

const NearbyUsers: React.FC = () => {
  const { nearbyUsers, refreshNearbyUsers } = useLocation();
  const { isOnline } = useOnline();
  const [avatarKey, setAvatarKey] = useState(0);

  // Listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdated = () => {
      setAvatarKey(prev => prev + 1);
    };
    
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    window.addEventListener('profileUpdated', handleAvatarUpdated);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
      window.removeEventListener('profileUpdated', handleAvatarUpdated);
    };
  }, []);

  if (!isOnline) return null;
  
  // Check if there are nearby users
  const hasNearbyUsers = nearbyUsers && nearbyUsers.length > 0;

  // Helper function to check if avatar is an image
  const isImageAvatar = (avatar?: string) => {
    return avatar && typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http'));
  };

  // Helper function to check if avatar is an emoji
  const isEmojiAvatar = (avatar?: string) => {
    return avatar && typeof avatar === 'string' && !avatar.startsWith('data:image/') && !avatar.startsWith('http') && avatar !== '👤';
  };

  // Get first letter safely for avatar fallback
  const getFirstLetter = (username?: string) => {
    return username && username.length > 0 ? username[0].toUpperCase() : '?';
  };

  // Helper function to render avatar
  const renderAvatar = (avatar?: string, username?: string) => {
    if (isImageAvatar(avatar)) {
      return (
        <img 
          key={`nearby-user-${username}-${avatarKey}`}
          src={avatar} 
          alt={username || 'User'} 
          className="w-12 h-12 rounded-full object-cover" 
          onError={(e) => {
            console.error('Avatar image failed to load for nearby user:', username);
            e.currentTarget.style.display = 'none';
          }}
        />
      );
    } else if (isEmojiAvatar(avatar)) {
      return (
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-xl">{avatar}</span>
        </div>
      );
    } else {
      // Fallback to first letter or icon
      return (
        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
          {username ? (
            <span className="font-semibold text-gray-600 text-sm">
              {getFirstLetter(username)}
            </span>
          ) : (
            <User size={20} className="text-gray-500" />
          )}
        </div>
      );
    }
  };

  // Handle chat button click
  const handleChatClick = (user: any) => {
    // TODO: Implement chat functionality
    console.log('Starting chat with:', user.username);
    // For now, just show an alert
    alert(`Chat feature coming soon! You clicked to chat with ${user.username}`);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Who's nearby</h2>
          <button 
            onClick={refreshNearbyUsers}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Content */}
      {!hasNearbyUsers ? (
        <div className="px-8 py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No one nearby</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            No users are currently nearby. Try refreshing or check back later to see who's around.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {nearbyUsers.map(user => (
            <div key={user.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {renderAvatar(user.avatar, user.username)}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1 mb-1">
                    <h3 className="font-bold text-gray-900 hover:underline cursor-pointer">
                      {user.username || 'Anonymous'}
                    </h3>
                    <span className="text-gray-500">@{(user.username || 'anonymous').toLowerCase()}</span>
                  </div>
                  
                  {/* Bio or Name */}
                  {user.bio && user.bio.trim() ? (
                    <p className="text-gray-700 text-sm leading-normal mb-2">
                      {user.bio}
                    </p>
                  ) : user.name && user.name.trim() && user.name !== user.username ? (
                    <p className="text-gray-500 text-sm mb-2">
                      {user.name}
                    </p>
                  ) : null}
                  
                  {/* Distance */}
                  <div className="flex items-center text-gray-500 text-sm">
                    <MapPin size={14} className="mr-1" />
                    <span>{Math.round(user.distance)} meters away</span>
                  </div>
                </div>
                
                {/* Chat Button */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleChatClick(user)}
                    className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-1.5 rounded-full font-semibold hover:bg-gray-800 transition-colors"
                  >
                    <MessageCircle size={16} />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyUsers; 