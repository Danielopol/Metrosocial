import React, { useState, useEffect } from 'react';
import { Edit3, MessageSquare, Settings, X, Calendar } from 'lucide-react';
import { ProximityLayersProps, ProximityUser, SocialPost } from '../../types';
import PostFeed from './PostFeed';
import CreatePost from './CreatePost';
import { Profile } from '../auth';
import { useOnline } from '../../context/OnlineContext';
import { usePosts } from '../../context/PostContext';

const ProximityLayers: React.FC<ProximityLayersProps> = ({ 
  nearbyUsers, 
  currentUser, 
  onUserClick, 
  onCreatePost 
}) => {
  const { isOnline, toggleOnlineStatus } = useOnline();
  const { getLatestUserPost } = usePosts();
  const [layerVisibility, setLayerVisibility] = useState({
    intimate: true,
    personal: true,
    social: true,
    public: true
  });
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ProximityUser | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render when avatar changes
  const [selectedUserLatestPost, setSelectedUserLatestPost] = useState<SocialPost | null>(null);
  const [loadingSelectedUserPost, setLoadingSelectedUserPost] = useState(false);

  // Listen for profile updates to refresh current user avatar
  useEffect(() => {
    const handleProfileUpdated = () => {
      console.log('Profile updated - refreshing proximity layers');
      setAvatarKey(prev => prev + 1);
    };

    const handleAvatarUpdated = () => {
      console.log('Avatar updated - refreshing proximity layers');
      setAvatarKey(prev => prev + 1);
    };

    const handlePostCreated = () => {
      console.log('Post created - closing modal');
      setShowPostModal(false);
    };

    window.addEventListener('profileUpdated', handleProfileUpdated);
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    window.addEventListener('postCreated', handlePostCreated);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
      window.removeEventListener('postCreated', handlePostCreated);
    };
  }, []);

  // Force re-render when currentUser prop changes
  useEffect(() => {
    setAvatarKey(prev => prev + 1);
  }, [currentUser?.avatar]);

  // Calculate proximity zone based on distance
  const calculateProximityZone = (distance: number): ProximityUser['zone'] => {
    if (distance <= 10) return 'intimate';
    if (distance <= 50) return 'personal';
    if (distance <= 200) return 'social';
    return 'public';
  };

  // Transform nearby users to proximity users
  const proximityUsers: ProximityUser[] = nearbyUsers.map((user: any) => ({
    id: user.id || user.userId,
    username: user.username,
    avatar: user.avatar || '👤',
    distance: user.distance,
    zone: calculateProximityZone(user.distance),
    status: 'online', // Default to online for now
    location: {
      lat: user.location?.latitude || 0,
      lng: user.location?.longitude || 0
    },
    name: user.name,
    bio: user.bio
  }));

  // Filter users by zone visibility
  const visibleUsers = proximityUsers.filter(user => layerVisibility[user.zone]);

  // Get zone colors and gradients
  const getZoneColor = (zone: string) => {
    const colors = {
      intimate: '#ef4444',
      personal: '#f59e0b',
      social: '#06d6a0',
      public: '#3b82f6'
    };
    return colors[zone as keyof typeof colors] || '#06d6a0';
  };

  const getZoneGradient = (zone: string) => {
    const gradients = {
      intimate: 'linear-gradient(45deg, #ef4444, #dc2626)',
      personal: 'linear-gradient(45deg, #f59e0b, #d97706)',
      social: 'linear-gradient(45deg, #06d6a0, #059669)',
      public: 'linear-gradient(45deg, #3b82f6, #2563eb)'
    };
    return gradients[zone as keyof typeof gradients] || 'linear-gradient(45deg, #06d6a0, #059669)';
  };

  // Helper function to check if avatar is an image
  const isImageAvatar = (avatar?: string) => {
    return avatar && typeof avatar === 'string' && (avatar.startsWith('data:image/') || avatar.startsWith('http'));
  };

  // Helper function to check if avatar is an emoji
  const isEmojiAvatar = (avatar?: string) => {
    if (!avatar || typeof avatar !== 'string') return false;
    
    // Don't treat image URLs as emojis
    if (avatar.startsWith('data:image/') || avatar.startsWith('http')) return false;
    
    // Don't treat the default placeholder as emoji
    if (avatar === '👤') return false;
    
    // Simple emoji detection using character code ranges
    // Check each character in the string
    const chars = Array.from(avatar);
    const hasEmoji = chars.some(char => {
      const code = char.codePointAt(0) || 0;
      return (
        (code >= 0x1F600 && code <= 0x1F64F) || // Emoticons
        (code >= 0x1F300 && code <= 0x1F5FF) || // Symbols & Pictographs  
        (code >= 0x1F680 && code <= 0x1F6FF) || // Transport & Map
        (code >= 0x2600 && code <= 0x26FF) ||   // Miscellaneous Symbols
        (code >= 0x2700 && code <= 0x27BF) ||   // Dingbats
        (code >= 0x1F900 && code <= 0x1F9FF) || // Supplemental Symbols
        (code >= 0x1F1E0 && code <= 0x1F1FF) || // Regional Indicators
        code === 0x200D ||                      // Zero Width Joiner
        code === 0xFE0F                         // Variation Selector
      );
    });
    
    // Allow reasonable length for emojis (including compound ones)
    return hasEmoji && avatar.length <= 20;
  };

  // Get first letter safely for avatar fallback
  const getFirstLetter = (username?: string) => {
    return username && username.length > 0 ? username[0].toUpperCase() : '?';
  };

  // Render avatar for user nodes
  const renderUserAvatar = (user: ProximityUser) => {
    const avatar = user.avatar;
    
    if (isImageAvatar(avatar)) {
      return (
        <img 
          src={avatar} 
          alt={user.username} 
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            console.error('Avatar image failed to load for user:', user.username);
            // Fallback to first letter on error
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `<span class="text-xl font-semibold text-white">${getFirstLetter(user.username)}</span>`;
          }}
        />
      );
    } else if (isEmojiAvatar(avatar)) {
      return <span className="text-2xl">{avatar}</span>;
    } else {
      // Fallback to first letter
      return <span className="text-xl font-semibold text-white">{getFirstLetter(user.username)}</span>;
    }
  };

  // Render avatar for current user
  const renderCurrentUserAvatar = () => {
    const avatar = currentUser?.avatar;
    
    if (isImageAvatar(avatar)) {
      return (
        <img 
          key={`current-user-avatar-${avatarKey}`}
          src={avatar} 
          alt={currentUser?.username} 
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            console.error('Avatar image failed to load for current user:', currentUser?.username);
            // Fallback to first letter on error
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `<span class="text-xl font-semibold text-white">${getFirstLetter(currentUser?.username)}</span>`;
          }}
        />
      );
    } else if (isEmojiAvatar(avatar)) {
      return <span key={`current-user-emoji-${avatarKey}`} className="text-2xl">{avatar}</span>;
    } else {
      // Fallback to first letter
      return <span key={`current-user-fallback-${avatarKey}`} className="text-xl font-semibold text-white">{getFirstLetter(currentUser?.username)}</span>;
    }
  };

  // Render avatar for modals
  const renderModalAvatar = (user: ProximityUser) => {
    const avatar = user.avatar;
    
    if (isImageAvatar(avatar)) {
      return (
        <img 
          src={avatar} 
          alt={user.username} 
          className="w-full h-full rounded-full object-cover"
          onError={(e) => {
            console.error('Avatar image failed to load for modal user:', user.username);
            // Fallback to first letter on error
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.innerHTML = `<span class="text-4xl font-semibold text-white">${getFirstLetter(user.username)}</span>`;
          }}
        />
      );
    } else if (isEmojiAvatar(avatar)) {
      return <span className="text-4xl">{avatar}</span>;
    } else {
      // Fallback to first letter
      return <span className="text-4xl font-semibold text-white">{getFirstLetter(user.username)}</span>;
    }
  };

  // Handle user click
  const handleUserClick = (user: ProximityUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
    onUserClick(user.id);
    
    // Fetch latest post for the selected user
    fetchLatestPostForUser(user.id);
  };

  // Handle current user click
  const handleCurrentUserClick = () => {
    if (currentUser) {
      const currentUserAsProximity: ProximityUser = {
        id: currentUser.id,
        username: currentUser.username,
        avatar: currentUser.avatar || '👤',
        distance: 0,
        zone: 'intimate',
        status: 'online',
        location: { lat: 0, lng: 0 },
        name: currentUser.name,
        bio: currentUser.bio
      };
      setSelectedUser(currentUserAsProximity);
      setShowUserModal(true);
      
      // Fetch latest post for current user
      fetchLatestPostForUser(currentUser.id);
    }
  };

  // Fetch latest post for a user
  const fetchLatestPostForUser = async (userId: string) => {
    setLoadingSelectedUserPost(true);
    setSelectedUserLatestPost(null);
    
    try {
      const post = await getLatestUserPost(userId);
      setSelectedUserLatestPost(post);
    } catch (error) {
      console.error('Error fetching latest post for user:', error);
    } finally {
      setLoadingSelectedUserPost(false);
    }
  };

  // Toggle layer visibility
  const toggleLayer = (layer: keyof typeof layerVisibility) => {
    setLayerVisibility(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  // Position users around circles
  const positionUser = (user: ProximityUser, index: number, totalInZone: number) => {
    const angle = (index / totalInZone) * 2 * Math.PI;
    
    // Responsive circle radii - smaller for mobile devices
    const isMobile = window.innerWidth < 768;
    const radiusMap = {
      intimate: isMobile ? 60 : 100,   // Mobile: 120px circle, Desktop: 200px circle
      personal: isMobile ? 90 : 150,   // Mobile: 180px circle, Desktop: 300px circle  
      social: isMobile ? 120 : 200,    // Mobile: 240px circle, Desktop: 400px circle
      public: isMobile ? 150 : 250     // Mobile: 300px circle, Desktop: 500px circle
    };
    const radius = radiusMap[user.zone];
    
    // Convert to CSS positioning - using transform instead of left/top for precision
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    
    return {
      left: '50%',
      top: '50%',
      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
    };
  };

  // Group users by zone for positioning
  const usersByZone = {
    intimate: visibleUsers.filter(u => u.zone === 'intimate'),
    personal: visibleUsers.filter(u => u.zone === 'personal'),
    social: visibleUsers.filter(u => u.zone === 'social'),
    public: visibleUsers.filter(u => u.zone === 'public')
  };

  return (
    <>
      <style>
        {`
          @keyframes proximity-pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.02); opacity: 0.8; }
          }
          .pulse-animation {
            animation: proximity-pulse 4s infinite;
          }
          .pulse-animation-delay-1 {
            animation: proximity-pulse 4s infinite 1s;
          }
          .pulse-animation-delay-2 {
            animation: proximity-pulse 4s infinite 2s;
          }
          .pulse-animation-delay-3 {
            animation: proximity-pulse 4s infinite 3s;
          }
        `}
      </style>
      <div className="relative w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Proximity Layers */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Public Layer */}
          <div 
            className={`absolute rounded-full border-2 border-blue-500 transition-all duration-500 pulse-animation ${
              layerVisibility.public ? 'opacity-60' : 'opacity-20'
            } w-[300px] h-[300px] sm:w-[500px] sm:h-[500px]`}
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.01) 70%, transparent 100%)'
            }}
          />
          
          {/* Social Layer */}
          <div 
            className={`absolute rounded-full border-2 border-green-500 transition-all duration-500 pulse-animation-delay-1 ${
              layerVisibility.social ? 'opacity-60' : 'opacity-20'
            } w-[240px] h-[240px] sm:w-[400px] sm:h-[400px]`}
            style={{
              background: 'radial-gradient(circle, rgba(6, 214, 160, 0.12) 0%, rgba(6, 214, 160, 0.02) 70%, transparent 100%)'
            }}
          />
          
          {/* Personal Layer */}
          <div 
            className={`absolute rounded-full border-2 border-orange-500 transition-all duration-500 pulse-animation-delay-2 ${
              layerVisibility.personal ? 'opacity-60' : 'opacity-20'
            } w-[180px] h-[180px] sm:w-[300px] sm:h-[300px]`}
            style={{
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 70%, transparent 100%)'
            }}
          />
          
          {/* Intimate Layer */}
          <div 
            className={`absolute rounded-full border-2 border-red-500 transition-all duration-500 pulse-animation-delay-3 ${
              layerVisibility.intimate ? 'opacity-60' : 'opacity-20'
            } w-[120px] h-[120px] sm:w-[200px] sm:h-[200px]`}
            style={{
              background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 70%, transparent 100%)'
            }}
          />

          {/* Current User Center */}
          <div 
            className="absolute rounded-full border-3 border-white cursor-pointer transition-all duration-300 hover:scale-110 z-20 flex items-center justify-center shadow-lg overflow-hidden w-10 h-10 sm:w-12 sm:h-12"
            style={{
              background: 'linear-gradient(45deg, #06d6a0, #3b82f6)',
              boxShadow: '0 0 20px rgba(6, 214, 160, 0.5)',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            onClick={handleCurrentUserClick}
          >
            {renderCurrentUserAvatar()}
            <div className="absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2 text-xs sm:text-sm font-bold text-green-400 whitespace-nowrap pointer-events-none"
                 style={{ 
                   textShadow: '0 1px 0 #000, 0 2px 0 #1a1a1a, 0 3px 0 #2a2a2a, 0 4px 0 #3a3a3a, 0 5px 6px rgba(0,0,0,0.6)' 
                 }}>
              You ({currentUser?.username || 'User'})
            </div>
          </div>

          {/* User Nodes */}
          {Object.entries(usersByZone).map(([zone, users]) =>
            users.map((user, index) => {
              const position = positionUser(user, index, users.length);
              return (
                <div
                  key={user.id}
                  className="absolute rounded-full border-3 cursor-pointer transition-all duration-300 hover:scale-120 hover:z-30 z-10 flex items-center justify-center overflow-hidden w-12 h-12 sm:w-16 sm:h-16"
                  style={{
                    left: position.left,
                    top: position.top,
                    transform: position.transform,
                    background: getZoneGradient(user.zone),
                    borderColor: getZoneColor(user.zone),
                    boxShadow: `0 0 20px ${getZoneColor(user.zone)}80`
                  }}
                  onClick={() => handleUserClick(user)}
                >
                  {renderUserAvatar(user)}
                  <div 
                    className="absolute -top-8 sm:-top-10 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap pointer-events-none"
                    style={{ 
                      textShadow: '0 1px 0 #000, 0 2px 0 #1a1a1a, 0 3px 0 #2a2a2a, 0 4px 0 #3a3a3a, 0 5px 6px rgba(0,0,0,0.6)' 
                    }}
                  >
                    {user.username}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Feed Split View */}
        {showFeed && (
          <div className="absolute inset-x-0 top-1/2 bottom-0 bg-white z-60 flex flex-col border-t-2 border-white/20">
            {/* Feed Header */}
            <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Community Feed</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl"
                onClick={() => setShowFeed(false)}
              >
                ×
              </button>
            </div>
            
            {/* Feed Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50 pb-20 sm:pb-6">
              <div className="max-w-2xl mx-auto">
                {/* Feed Header Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mx-4 mb-4 p-3">
                  <p className="text-gray-600 text-sm">
                    See what people in your area are sharing
                  </p>
                </div>
                
                {/* Posts Feed Component */}
                <div className="mx-4 pb-6">
                  <PostFeed />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Layer Controls Panel - Only visible on desktop */}
        <div className={`absolute left-4 sm:left-8 transition-all duration-300 z-50 hidden sm:block ${
          showFeed ? 'bottom-8' : 'bottom-8'
        } ${controlsExpanded ? 'bg-black/60 backdrop-blur-md border border-white/20 rounded-2xl p-3 sm:p-5' : ''}`}>
          <button
            className="w-15 h-15 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-all duration-300"
            onClick={() => setControlsExpanded(!controlsExpanded)}
            style={{ boxShadow: '0 4px 20px rgba(6, 214, 160, 0.3)' }}
          >
            {controlsExpanded ? <X size={20} /> : <Settings size={20} />}
          </button>
          
          {controlsExpanded && (
            <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
              <h3 className="text-white font-bold text-lg mb-4">Layer Controls</h3>
              
              {[
                { key: 'intimate', label: 'Intimate Zone', color: '#ef4444', range: '0-10m' },
                { key: 'personal', label: 'Personal Zone', color: '#f59e0b', range: '10-50m' },
                { key: 'social', label: 'Social Zone', color: '#06d6a0', range: '50-200m' },
                { key: 'public', label: 'Public Zone', color: '#3b82f6', range: '200m+' }
              ].map(({ key, label, color, range }) => (
                <div 
                  key={key}
                  className="flex items-center justify-between cursor-pointer hover:bg-white/10 p-3 rounded-lg transition-all duration-200"
                  onClick={() => toggleLayer(key as keyof typeof layerVisibility)}
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className={`w-4 h-4 border-2 rounded ${
                        layerVisibility[key as keyof typeof layerVisibility] ? 'bg-current' : 'bg-transparent'
                      }`}
                      style={{ borderColor: color, color }}
                    >
                      {layerVisibility[key as keyof typeof layerVisibility] && (
                        <div className="w-full h-full flex items-center justify-center text-xs">✓</div>
                      )}
                    </div>
                    <span className="text-white font-semibold" style={{ color }}>{label}</span>
                  </div>
                  <span className="text-xs text-gray-400">{range}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Action Buttons - Only visible on desktop */}
        <div className="absolute right-4 sm:right-8 flex flex-col space-y-4 z-50 hidden sm:flex bottom-8">
          {/* Feed Button */}
          <button
            className={`w-15 h-15 rounded-full border-3 border-white text-white flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-all duration-300 ${
              showFeed 
                ? 'bg-gradient-to-r from-gray-600 to-gray-700' 
                : 'bg-gradient-to-r from-purple-500 to-purple-600'
            }`}
            style={{ 
              boxShadow: showFeed 
                ? '0 4px 20px rgba(75, 85, 99, 0.4)' 
                : '0 4px 20px rgba(147, 51, 234, 0.4)' 
            }}
            onClick={() => setShowFeed(!showFeed)}
          >
            <MessageSquare size={20} />
          </button>
          
          {/* Post Button */}
          <button
            className="w-15 h-15 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border-3 border-white text-white flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-all duration-300"
            style={{ boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}
            onClick={() => setShowPostModal(true)}
          >
            <Edit3 size={20} />
          </button>
        </div>

        {/* Mobile Bottom Navigation Bar - Only visible on mobile */}
        <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-white/20 p-4 z-50 sm:hidden">
          <div className="flex items-center justify-around max-w-md mx-auto">
            {/* Settings Button */}
            <button
              className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95"
              onClick={() => setControlsExpanded(!controlsExpanded)}
              style={{ boxShadow: '0 4px 20px rgba(6, 214, 160, 0.3)' }}
            >
              <Settings size={18} />
            </button>
            
            {/* Feed Button */}
            <button
              className={`w-12 h-12 rounded-full border-2 border-white text-white flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95 ${
                showFeed 
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600'
              }`}
              style={{ 
                boxShadow: showFeed 
                  ? '0 4px 20px rgba(75, 85, 99, 0.4)' 
                  : '0 4px 20px rgba(147, 51, 234, 0.4)' 
              }}
              onClick={() => setShowFeed(!showFeed)}
            >
              <MessageSquare size={18} />
            </button>
            
            {/* Post Button */}
            <button
              className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-white text-white flex items-center justify-center shadow-lg transition-all duration-300 active:scale-95"
              style={{ boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)' }}
              onClick={() => setShowPostModal(true)}
            >
              <Edit3 size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Layer Controls Overlay - Only visible when expanded on mobile */}
        {controlsExpanded && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-60 sm:hidden">
            <div className="flex items-center justify-center min-h-screen p-4">
              <div className="bg-gray-900/95 border border-white/20 rounded-3xl p-6 max-w-sm w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-lg">Layer Controls</h3>
                  <button
                    className="text-gray-400 hover:text-white text-xl"
                    onClick={() => setControlsExpanded(false)}
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  {[
                    { key: 'intimate', label: 'Intimate Zone', color: '#ef4444', range: '0-10m' },
                    { key: 'personal', label: 'Personal Zone', color: '#f59e0b', range: '10-50m' },
                    { key: 'social', label: 'Social Zone', color: '#06d6a0', range: '50-200m' },
                    { key: 'public', label: 'Public Zone', color: '#3b82f6', range: '200m+' }
                  ].map(({ key, label, color, range }) => (
                    <div 
                      key={key}
                      className="flex items-center justify-between cursor-pointer hover:bg-white/10 p-3 rounded-lg transition-all duration-200"
                      onClick={() => toggleLayer(key as keyof typeof layerVisibility)}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-4 h-4 border-2 rounded ${
                            layerVisibility[key as keyof typeof layerVisibility] ? 'bg-current' : 'bg-transparent'
                          }`}
                          style={{ borderColor: color, color }}
                        >
                          {layerVisibility[key as keyof typeof layerVisibility] && (
                            <div className="w-full h-full flex items-center justify-center text-xs">✓</div>
                          )}
                        </div>
                        <span className="text-white font-semibold" style={{ color }}>{label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Profile Modal */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/98 border border-white/20 rounded-3xl p-8 max-w-md w-11/12 shadow-2xl relative">
              <button
                className="absolute top-4 right-6 text-gray-400 hover:text-white text-2xl"
                onClick={() => setShowUserModal(false)}
              >
                ×
              </button>
              
              <div className="text-center">
                <div 
                  className="w-24 h-24 rounded-full border-4 mx-auto mb-4 flex items-center justify-center overflow-hidden"
                  style={{
                    background: getZoneGradient(selectedUser.zone),
                    borderColor: getZoneColor(selectedUser.zone)
                  }}
                >
                  {renderModalAvatar(selectedUser)}
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{selectedUser.username}</h2>
                
                {/* Check if this is the current user */}
                {selectedUser.id === currentUser?.id ? (
                  // Current user profile view
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 border border-green-500 text-green-400">
                        Your Profile
                      </span>
                    </div>
                    
                    {/* Full profile information */}
                    <div className="bg-white/10 rounded-lg p-4 mb-4 text-left space-y-3">
                      <div>
                        <span className="text-gray-400 text-sm">Full Name:</span>
                        <p className="text-white font-medium">{currentUser?.name || 'Not set'}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Email:</span>
                        <p className="text-white font-medium">{currentUser?.email}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-400 text-sm">Username:</span>
                        <p className="text-white font-medium">{currentUser?.username}</p>
                      </div>
                      
                      {currentUser?.bio && (
                        <div>
                          <span className="text-gray-400 text-sm">Bio:</span>
                          <p className="text-gray-300 leading-relaxed">{currentUser.bio}</p>
                        </div>
                      )}
                      
                      {!currentUser?.bio && (
                        <div>
                          <span className="text-gray-400 text-sm">Bio:</span>
                          <p className="text-gray-500 italic">No bio added yet</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Latest Post Section for Current User */}
                    {!loadingSelectedUserPost && selectedUserLatestPost && (
                      <div className="bg-white/20 rounded-lg p-4 mb-4 border border-white/30">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-blue-300" />
                          <h5 className="text-sm font-bold text-blue-200 uppercase tracking-wide">Latest Message</h5>
                        </div>
                        
                        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                          <p className="text-white text-sm leading-relaxed mb-2">
                            {selectedUserLatestPost.text || (selectedUserLatestPost.url ? `Shared: ${selectedUserLatestPost.url}` : 'Shared an image')}
                          </p>
                          
                          {selectedUserLatestPost.image && (
                            <div className="mt-2 rounded-lg overflow-hidden">
                              <img 
                                src={selectedUserLatestPost.image} 
                                alt="Latest post" 
                                className="w-full max-h-24 object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-300">
                            <Calendar size={12} />
                            <span>{new Date(selectedUserLatestPost.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {loadingSelectedUserPost && (
                      <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-gray-400" />
                          <h5 className="text-sm font-semibold text-gray-300">Latest Message</h5>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="animate-pulse">
                            <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-white/20 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!loadingSelectedUserPost && !selectedUserLatestPost && (
                      <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-gray-400" />
                          <h5 className="text-sm font-semibold text-gray-300">Latest Message</h5>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-gray-400 text-sm italic">No posts yet</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Online</span>
                    </div>
                    
                    <div className="flex gap-4 justify-center">
                      <button 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-all duration-200"
                        onClick={() => {
                          setShowUserModal(false);
                          setShowProfileEdit(true);
                        }}
                      >
                        ✏️ Edit Profile
                      </button>
                    </div>
                  </div>
                ) : (
                  // Other user profile view
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-bold border"
                        style={{ 
                          backgroundColor: `${getZoneColor(selectedUser.zone)}20`,
                          borderColor: getZoneColor(selectedUser.zone),
                          color: getZoneColor(selectedUser.zone)
                        }}
                      >
                        {selectedUser.zone.charAt(0).toUpperCase() + selectedUser.zone.slice(1)} Zone
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{Math.round(selectedUser.distance)}m away</span>
                    </div>
                    
                    {selectedUser.bio && (
                      <div className="bg-white/10 rounded-lg p-4 mb-6">
                        <p className="text-gray-300 text-sm leading-relaxed">{selectedUser.bio}</p>
                      </div>
                    )}
                    
                    {/* Latest Post Section for Other Users */}
                    {!loadingSelectedUserPost && selectedUserLatestPost && (
                      <div className="bg-white/20 rounded-lg p-4 mb-4 border border-white/30">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-blue-300" />
                          <h5 className="text-sm font-bold text-blue-200 uppercase tracking-wide">Latest Message</h5>
                        </div>
                        
                        <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                          <p className="text-white text-sm leading-relaxed mb-2">
                            {selectedUserLatestPost.text || (selectedUserLatestPost.url ? `Shared: ${selectedUserLatestPost.url}` : 'Shared an image')}
                          </p>
                          
                          {selectedUserLatestPost.image && (
                            <div className="mt-2 rounded-lg overflow-hidden">
                              <img 
                                src={selectedUserLatestPost.image} 
                                alt="Latest post" 
                                className="w-full max-h-24 object-cover"
                              />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-300">
                            <Calendar size={12} />
                            <span>{new Date(selectedUserLatestPost.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {loadingSelectedUserPost && (
                      <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-gray-400" />
                          <h5 className="text-sm font-semibold text-gray-300">Latest Message</h5>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="animate-pulse">
                            <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-white/20 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {!loadingSelectedUserPost && !selectedUserLatestPost && (
                      <div className="bg-white/10 rounded-lg p-4 mb-4 border border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <MessageSquare size={16} className="text-gray-400" />
                          <h5 className="text-sm font-semibold text-gray-300">Latest Message</h5>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <p className="text-gray-400 text-sm italic">No posts yet</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-400 text-sm">Online</span>
                    </div>
                    
                    <div className="flex gap-4 justify-center">
                      <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-all duration-200">
                        💬 Start Chat
                      </button>
                      <button className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2 rounded-full font-semibold hover:scale-105 transition-all duration-200">
                        👤 View Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Post Creation Modal */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl max-w-lg w-11/12 shadow-2xl relative max-h-[90vh] overflow-hidden">
              <button
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl z-10"
                onClick={() => setShowPostModal(false)}
              >
                ×
              </button>
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Create Post</h3>
              </div>
              
              {/* CreatePost Component */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <CreatePost />
              </div>
            </div>
          </div>
        )}

        {/* Profile Edit Modal */}
        {showProfileEdit && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl max-w-lg w-11/12 shadow-2xl relative max-h-[90vh] overflow-hidden">
              <button
                className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-2xl z-10"
                onClick={() => setShowProfileEdit(false)}
              >
                ×
              </button>
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
              </div>
              
              {/* Profile Component */}
              <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                <Profile onClose={() => setShowProfileEdit(false)} initialEditMode={true} />
              </div>
            </div>
          </div>
        )}

        {/* Online Toggle Control */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
          {/* Online Toggle Switch */}
          <div 
            className={`w-14 h-7 sm:w-16 sm:h-8 rounded-full flex items-center p-1 cursor-pointer transition-all duration-300 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            } shadow-lg backdrop-blur-md`}
            onClick={toggleOnlineStatus}
          >
            <div 
              className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white shadow-md transform transition-all duration-300 flex items-center justify-center ${
                isOnline ? 'translate-x-7 sm:translate-x-8' : 'translate-x-0'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
          </div>
          
          {/* Status Text */}
          <div className="text-center mt-1 sm:mt-2">
            <span className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-gray-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProximityLayers; 