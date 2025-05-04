import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AuthUser } from '../../types';

interface ProfileProps {
  onClose?: () => void;
}

const EMOJI_OPTIONS = ['👤', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨', '👨‍🚀', '👩‍🚀', '🧑‍🎓', '👨‍🎓', '👩‍🎓'];

const Profile: React.FC<ProfileProps> = ({ onClose }) => {
  const { authState, updateProfile, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<AuthUser>>(authState.user || {});
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState(authState.user?.avatar || '👤');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setUploadedImage(e.target.result);
          // Store either emoji or image URL in avatar field
          setFormData({
            ...formData,
            avatar: e.target.result
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      // Update profile with either emoji or uploaded image
      await updateProfile({
        ...formData,
        avatar: uploadedImage || selectedEmoji
      });
      setIsEditing(false);
    } catch (error: any) {
      setFormError(error.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto max-h-[90vh] flex flex-col overflow-hidden">
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
      
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isEditing ? 'Edit Profile' : 'Your Profile'}
      </h2>
      
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {formError}
        </div>
      )}
      
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="overflow-y-auto flex-grow pr-1">
            <div className="mb-4 flex flex-col items-center">
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
                  <img src={uploadedImage} alt="Profile" className="w-full h-full object-cover" />
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
              
              <div className="flex flex-wrap justify-center gap-2 mb-2">
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
          
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
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
        <div className="overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl mb-2 overflow-hidden">
              {typeof authState.user.avatar === 'string' && authState.user.avatar.startsWith('data:image/') ? (
                <img src={authState.user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                authState.user.avatar || '👤'
              )}
            </div>
            <h3 className="text-xl font-semibold">{authState.user.name}</h3>
            <p className="text-gray-500">@{authState.user.username}</p>
          </div>
          
          {authState.user.bio && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-1">Bio</h4>
              <p>{authState.user.bio}</p>
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Email</h4>
            <p>{authState.user.email}</p>
          </div>
          
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-500 mb-1">Member Since</h4>
            <p>{new Date(authState.user.createdAt).toLocaleDateString()}</p>
          </div>
          
          <div className="flex gap-2 mt-8">
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