import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../context/PostContext';
import { AuthUser, SocialPost } from '../../types';
import { MessageSquare, Calendar } from 'lucide-react';

interface ProfileProps {
  onClose?: () => void;
  initialEditMode?: boolean;
  isModal?: boolean;
}

const EMOJI_OPTIONS = ['👤', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🚀', '👩‍🚀', '🧑‍🎓', '👨‍🎓', '👩‍🎓'];

const Profile: React.FC<ProfileProps> = ({ onClose, initialEditMode, isModal }) => {
  const { authState, updateProfile, logout } = useAuth();
  const { getLatestUserPost } = usePosts();
  const [isEditing, setIsEditing] = useState(initialEditMode || false);
  const [formData, setFormData] = useState<Partial<AuthUser>>(authState.user || {});
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('👤');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(0); // Force re-render key
  const [refreshRequired, setRefreshRequired] = useState(false); // Flag to force re-render
  const [latestPost, setLatestPost] = useState<SocialPost | null>(null);
  const [loadingLatestPost, setLoadingLatestPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force the component to re-render when avatar changes
  useEffect(() => {
    if (refreshRequired) {
      setAvatarKey(prev => prev + 1);
      setRefreshRequired(false);
    }
  }, [refreshRequired]);

  // Initialize avatar state when authState changes or when editing is toggled
  useEffect(() => {
    if (authState.user) {
      // Reset form data based on current user data
      setFormData({...authState.user});
      
      // Handle avatar initialization
      const avatar = authState.user.avatar;
      if (avatar) {
        if (typeof avatar === 'string' && avatar.startsWith('data:image/')) {
          setUploadedImage(avatar);
          setSelectedEmoji('👤'); // Default emoji if we're using an image
        } else {
          setSelectedEmoji(avatar as string);
          setUploadedImage(null);
        }
        // Force re-render of avatar
        setAvatarKey(prev => prev + 1);
      }
    }
  }, [authState.user, isEditing]);

  // Fetch user's latest post
  useEffect(() => {
    const fetchLatestPost = async () => {
      if (!authState.user?.id) return;
      
      setLoadingLatestPost(true);
      try {
        const post = await getLatestUserPost(authState.user.id);
        setLatestPost(post);
      } catch (error) {
        console.error('Error fetching latest post:', error);
      } finally {
        setLoadingLatestPost(false);
      }
    };

    fetchLatestPost();
    
    // Listen for new posts to refresh latest post
    const handlePostCreated = (event: CustomEvent) => {
      const newPost = event.detail;
      if (newPost.userId === authState.user?.id) {
        setLatestPost(newPost);
      }
    };
    
    window.addEventListener('postCreated', handlePostCreated as EventListener);
    
    return () => {
      window.removeEventListener('postCreated', handlePostCreated as EventListener);
    };
  }, [authState.user?.id, getLatestUserPost]);

  if (!authState.user) {
    return <div>User not authenticated</div>;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setUploadedImage(null);
    setFormData({
      ...formData,
      avatar: emoji
    });
  };

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Image size should be less than 5MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setFormError('Please upload an image file');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          const imageData = e.target.result;
          setUploadedImage(imageData);
          setFormData(prev => ({
            ...prev,
            avatar: imageData
          }));
          setAvatarKey(prev => prev + 1); // Force re-render
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('==== PROFILE FORM SUBMIT ====');
    setFormError(null);
    
    try {
      // Create profile update data with current avatar
      const profileData = {
        ...formData,
        // Ensure we're using the correct avatar value
        avatar: uploadedImage || selectedEmoji
      };
      
      // Log the form data being submitted
      console.log("Current user state:", JSON.stringify({
        id: authState.user?.id,
        username: authState.user?.username,
        name: authState.user?.name,
        hasToken: !!authState.token
      }));
      
      console.log("Form data being submitted:", JSON.stringify({
        ...profileData,
        avatar: profileData.avatar ? 
          (typeof profileData.avatar === 'string' && profileData.avatar.startsWith('data:image/') ? 
            'Image data (length: ' + profileData.avatar.length + ')' : profileData.avatar) : null
      }));
      
      console.log("About to call updateProfile...");
      // Wait for update to complete
      await updateProfile(profileData);
      console.log("updateProfile completed successfully");
      
      // Force refresh of UI components
      setRefreshRequired(true);
      setAvatarKey(prev => prev + 1);
      
      // Dispatch event for other components to catch
      window.dispatchEvent(new Event('avatarUpdated'));
      console.log("Dispatched avatarUpdated event");
      
      // Close edit mode
      setIsEditing(false);
      console.log('==== PROFILE UPDATE COMPLETE ====');
    } catch (error: any) {
      console.error('==== PROFILE UPDATE ERROR ====');
      console.error('Error updating profile:', error.message);
      console.error(error);
      setFormError(error.message);
    }
  };

  // Determine if current avatar is an image
  const isImageAvatar = typeof authState.user.avatar === 'string' && 
    authState.user.avatar.startsWith('data:image/');

  return (
    <div className={`p-6 flex flex-col min-h-0 ${
      isModal 
        ? '' // In modal - no extra styling needed
        : 'bg-white rounded-lg shadow-md max-w-md mx-auto max-h-[90vh] overflow-hidden' // Standalone - full styling
    }`}>
      {onClose && (
        <div className="flex justify-end">
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
      
      {!isModal && (
        <h2 className="text-2xl font-bold mb-4">
          {isEditing ? 'Edit Profile' : 'Your Profile'}
        </h2>
      )}
      
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {formError}
        </div>
      )}
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
          <div className="flex-grow pr-1 min-h-0">
            <div className="mb-4 flex flex-col items-start">
              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              {/* Avatar preview */}
              <div 
                className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl mb-2 cursor-pointer relative overflow-hidden"
                onClick={handleAvatarClick}
              >
                {uploadedImage ? (
                  <img 
                    key={`upload-preview-${avatarKey}`} 
                    src={uploadedImage} 
                    alt="Profile" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  selectedEmoji
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-center justify-center transition-all">
                  <span className="text-white text-sm opacity-0 hover:opacity-100">Change</span>
                </div>
              </div>
              
              <div className="text-xs text-blue-500 mb-3">
                Click avatar to upload image
              </div>
              
              <div className="flex flex-wrap justify-start gap-2 mb-2">
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${emoji === selectedEmoji && !uploadedImage ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-100'}`}
                    onClick={() => handleEmojiSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.username || ''}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name || ''}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="bio">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.bio || ''}
                onChange={handleChange}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                value={authState.user.email}
                readOnly
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200 shrink-0">
            <button
              type="button"
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              disabled={authState.loading}
            >
              {authState.loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div>
          {/* Centered profile layout */}
          <div className="flex flex-col items-center text-center mb-6">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 mb-3">
              {isImageAvatar ? (
                <div 
                  key={`profile-image-${avatarKey}`}
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
            
            {/* Profile Info - centered */}
            <div className="text-center">
              {/* Name */}
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {authState.user.name}
              </h3>
              
              {/* Handle */}
              <p className="text-gray-500 text-sm mb-2">
                @{authState.user.username}
              </p>
              
              {/* Bio */}
              {authState.user.bio && (
                <p className="text-gray-900 text-sm leading-relaxed">
                  {authState.user.bio}
                </p>
              )}
            </div>
          </div>
          
          {/* Latest Post Section - Prominent Display */}
          {!loadingLatestPost && latestPost && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={18} className="text-blue-600" />
                <h4 className="text-sm font-bold text-blue-800 uppercase tracking-wide">Latest Message</h4>
              </div>
              
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <p className="text-gray-800 text-sm leading-relaxed mb-2">
                  {latestPost.text || (latestPost.url ? `Shared: ${latestPost.url}` : 'Shared an image')}
                </p>
                
                {latestPost.image && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img 
                      src={latestPost.image} 
                      alt="Latest post" 
                      className="w-full max-h-32 object-cover"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Calendar size={12} />
                  <span>{new Date(latestPost.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}
          
          {loadingLatestPost && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={18} className="text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-600">Latest Message</h4>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          )}
          
          {!loadingLatestPost && !latestPost && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={18} className="text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-600">Latest Message</h4>
              </div>
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <p className="text-gray-500 text-sm italic">No posts yet</p>
              </div>
            </div>
          )}
          
          {/* Additional info section */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Email</h4>
              <p className="text-sm">{authState.user.email}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Member Since</h4>
              <p className="text-sm">{new Date(authState.user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
            <button
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </button>
            <button
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 