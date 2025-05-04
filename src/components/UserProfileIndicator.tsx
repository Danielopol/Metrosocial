import React from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfileIndicator: React.FC = () => {
  const { authState } = useAuth();
  
  if (!authState.isAuthenticated || !authState.user) {
    return null;
  }

  return (
    <div className="user-profile-indicator bg-white shadow-md rounded-lg p-3 mb-4 flex items-center">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl mr-3 overflow-hidden">
        {typeof authState.user.avatar === 'string' && authState.user.avatar.startsWith('data:image/') ? (
          <img src={authState.user.avatar} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          authState.user.avatar || '👤'
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold">{authState.user.name}</p>
        <p className="text-xs text-gray-500">@{authState.user.username}</p>
      </div>
      {authState.user.bio && (
        <div className="ml-2 text-xs text-gray-600 max-w-xs overflow-hidden overflow-ellipsis whitespace-nowrap">
          {authState.user.bio}
        </div>
      )}
    </div>
  );
};

export default UserProfileIndicator; 