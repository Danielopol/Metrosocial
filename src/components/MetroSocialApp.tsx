import React, { useState } from 'react';
import { Users, Map, MessageSquare, Heart, Share2, Eye, User } from 'lucide-react';
import { User as UserType } from '../types';
import UserProfileIndicator from './UserProfileIndicator';
import { useAuth } from '../context/AuthContext';
import { Profile } from '../components/auth';

interface Comment {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
}

const MetroSocialApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [isOnline, setIsOnline] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const { authState } = useAuth();
  const [liked, setLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      user: { name: 'Emma', avatar: '👩‍🦰' },
      text: "That's really interesting! I was just reading about this yesterday.",
      timestamp: '2 min ago'
    },
    {
      id: 2,
      user: { name: 'David', avatar: '🧔' },
      text: 'I saw a similar article but with different conclusions. Check your DMs!',
      timestamp: 'Just now'
    }
  ]);
  
  // Toggle online status
  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline);
    if (!isOnline) {
      // Simulate finding nearby users when going online
      setNearbyUsers([
        { id: 1, name: 'Alex', distance: '5m away', avatar: '👨‍💼', content: 'news', contentDetail: 'Browsing BBC News' },
        { id: 2, name: 'Sofia', distance: '8m away', avatar: '👩‍🎓', content: 'social', contentDetail: 'Scrolling Instagram' },
        { id: 3, name: 'Marco', distance: '12m away', avatar: '👨‍🎨', content: 'video', contentDetail: 'Watching YouTube' }
      ]);
    } else {
      setNearbyUsers([]);
      setSelectedUser(null);
    }
  };
  
  // View user's content
  const viewUserContent = (user: UserType) => {
    setSelectedUser(user);
    setCurrentScreen('viewContent');
    setLiked(false);
    setShowCommentInput(false);
  };
  
  // Back to nearby users
  const backToNearby = () => {
    setSelectedUser(null);
    setCurrentScreen('home');
  };
  
  // Show profile
  const handleShowProfile = () => {
    setShowProfile(true);
  };
  
  // Handle like button click
  const handleLike = () => {
    setLiked(!liked);
  };
  
  // Handle comment button click
  const handleComment = () => {
    setShowCommentInput(!showCommentInput);
  };
  
  // Handle share button click
  const handleShare = () => {
    alert(`You shared ${selectedUser?.name}'s content: ${selectedUser?.contentDetail}`);
  };
  
  // Add a new comment
  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim() === '') return;
    
    const newComment: Comment = {
      id: comments.length + 1,
      user: {
        name: authState.user?.name || 'You',
        avatar: authState.user?.avatar || '👤'
      },
      text: commentText,
      timestamp: 'Just now'
    };
    
    setComments([...comments, newComment]);
    setCommentText('');
    setShowCommentInput(false);
  };
  
  // Get content preview based on type
  const getContentPreview = (contentType: string) => {
    switch(contentType) {
      case 'news':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="font-bold text-lg">Breaking News</h3>
            <p className="text-sm text-gray-700">Scientists discover new renewable energy source that could revolutionize...</p>
            <div className="flex items-center mt-2">
              <img src="https://via.placeholder.com/80x40" alt="News source" className="rounded"/>
              <span className="ml-2 text-xs text-gray-500">BBC News • 12 min ago</span>
            </div>
          </div>
        );
      case 'social':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center">👤</div>
              <span className="ml-2 font-semibold text-sm">photography_lover</span>
            </div>
            <img src="https://via.placeholder.com/300x200" alt="Social post" className="rounded mt-2"/>
            <div className="flex items-center mt-2 text-gray-500 text-sm">
              <Heart size={16} className="mr-1"/> 1,245
              <MessageSquare size={16} className="ml-4 mr-1"/> 42
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="bg-white rounded-lg border border-gray-200 p-2">
            <div className="relative">
              <img src="https://via.placeholder.com/300x180" alt="Video thumbnail" className="rounded"/>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-red-500 ml-1"></div>
                </div>
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                5:42
              </div>
            </div>
            <h3 className="font-semibold text-sm mt-2">Amazing Travel Vlog: Hidden Gems in Europe</h3>
            <div className="flex items-center mt-1">
              <div className="w-6 h-6 bg-red-200 rounded-full flex items-center justify-center text-xs">🎥</div>
              <span className="ml-2 text-xs text-gray-500">TravelWithMe • 245K views</span>
            </div>
          </div>
        );
      default:
        return <div>No preview available</div>;
    }
  };
  
  // Helper function to render avatar
  const renderAvatar = (avatar: string | undefined) => {
    if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
      return <img src={avatar} alt="Profile" className="w-full h-full object-cover" />;
    }
    return avatar || '👤';
  };
  
  // Render current screen
  const renderScreen = () => {
    if (currentScreen === 'home') {
      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">MetroSocial</h1>
            <div className="flex items-center">
              <div 
                className={`w-12 h-6 rounded-full flex items-center p-1 ${isOnline ? 'bg-green-400' : 'bg-gray-300'}`}
                onClick={toggleOnlineStatus}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${isOnline ? 'translate-x-5' : 'translate-x-0'}`}
                ></div>
              </div>
              <span className="ml-2 text-sm">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
          
          {/* User Profile Indicator */}
          <UserProfileIndicator />
          
          {isOnline ? (
            <>
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <div className="flex items-center">
                  <Map size={20} className="text-blue-500 mr-2"/>
                  <p className="text-sm">You're visible to nearby MetroSocial users</p>
                </div>
              </div>
              
              <h2 className="font-semibold text-lg mb-3">People Nearby</h2>
              {nearbyUsers.map((user: UserType) => (
                <div 
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm mb-3 border border-gray-100"
                  onClick={() => viewUserContent(user)}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden">
                      {renderAvatar(user.avatar)}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.distance}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-xs text-gray-500">{user.contentDetail}</div>
                    <div className="flex items-center mt-1">
                      <Eye size={16} className="text-blue-500 mr-1"/>
                      <span className="text-xs text-blue-500">View</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                <Users size={32} className="text-gray-400"/>
              </div>
              <p className="text-center text-gray-500 mb-4">Go online to discover people around you and see what they're browsing</p>
              <button 
                className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium"
                onClick={toggleOnlineStatus}
              >
                Go Online
              </button>
            </div>
          )}
        </div>
      );
    } else if (currentScreen === 'viewContent' && selectedUser) {
      return (
        <div className="p-4">
          <button 
            className="flex items-center text-blue-500 mb-4"
            onClick={backToNearby}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          {/* User Profile Indicator */}
          <UserProfileIndicator />
          
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-2xl overflow-hidden">
              {renderAvatar(selectedUser.avatar)}
            </div>
            <div className="ml-3">
              <p className="font-medium text-lg">{selectedUser.name}</p>
              <p className="text-sm text-gray-500">{selectedUser.distance}</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Currently browsing:</p>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {getContentPreview(selectedUser.content)}
            </div>
          </div>
          
          <div className="flex justify-around border-t border-b border-gray-200 py-3 mb-4">
            <button
              className="flex flex-col items-center"
              onClick={handleLike}
            >
              <Heart 
                size={20} 
                className={liked ? "text-red-500 fill-red-500" : "text-gray-600"} 
              />
              <span className={`text-xs mt-1 ${liked ? "text-red-500" : "text-gray-600"}`}>Like</span>
            </button>
            <button
              className="flex flex-col items-center"
              onClick={handleComment}
            >
              <MessageSquare size={20} className={showCommentInput ? "text-blue-500" : "text-gray-600"}/>
              <span className={`text-xs mt-1 ${showCommentInput ? "text-blue-500" : "text-gray-600"}`}>Comment</span>
            </button>
            <button
              className="flex flex-col items-center"
              onClick={handleShare}
            >
              <Share2 size={20} className="text-gray-600"/>
              <span className="text-xs text-gray-600 mt-1">Share</span>
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm font-medium mb-2">Comments ({comments.length})</p>
            
            {showCommentInput && (
              <form onSubmit={addComment} className="mb-3">
                <div className="flex">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 overflow-hidden">
                    {renderAvatar(authState.user?.avatar)}
                  </div>
                  <input
                    type="text"
                    className="flex-1 p-2 rounded-md border border-gray-300 text-sm"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
                    disabled={commentText.trim() === ''}
                  >
                    Post
                  </button>
                </div>
              </form>
            )}
            
            {comments.map((comment) => (
              <div key={comment.id} className="bg-white rounded p-3 mb-2">
                <div className="flex items-start">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm mr-2 overflow-hidden">
                    {renderAvatar(comment.user.avatar)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{comment.user.name}</p>
                    <p className="text-xs text-gray-700">{comment.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{comment.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };
  
  // Bottom navigation bar
  const renderNavBar = () => {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-center py-2">
        <button 
          className="flex flex-col items-center w-1/3"
          onClick={() => setCurrentScreen('home')}
        >
          <Users size={20} className={`${currentScreen === 'home' ? 'text-blue-500' : 'text-gray-500'}`}/>
          <span className={`text-xs mt-1 ${currentScreen === 'home' ? 'text-blue-500' : 'text-gray-500'}`}>Nearby</span>
        </button>
        <button 
          className="flex flex-col items-center w-1/3"
          onClick={handleShowProfile}
        >
          <User size={20} className={`${showProfile ? 'text-blue-500' : 'text-gray-500'}`}/>
          <span className={`text-xs mt-1 ${showProfile ? 'text-blue-500' : 'text-gray-500'}`}>Profile</span>
        </button>
      </div>
    );
  };
  
  // Profile Modal
  const renderProfileModal = () => {
    if (!showProfile) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-20 flex items-start justify-center p-4 overflow-y-auto pt-10">
        <div className="w-full max-w-md mb-10">
          <Profile onClose={() => setShowProfile(false)} />
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto pb-16">
        {renderScreen()}
      </div>
      {renderNavBar()}
      {renderProfileModal()}
    </div>
  );
};

export default MetroSocialApp; 