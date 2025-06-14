import React, { useState, useRef } from 'react';
import { usePosts } from '../../context/PostContext';
import { useOnline } from '../../context/OnlineContext';
import { useAuth } from '../../context/AuthContext';
import { Image, Link, X } from 'lucide-react';

const CreatePost: React.FC = () => {
  const { createPost } = usePosts();
  const { isOnline } = useOnline();
  const { authState } = useAuth();
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOnline || !authState.user) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPost({ text, url: url || undefined, image });
    setText('');
    setUrl('');
    setImage(undefined);
    setShowUrlInput(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = () => {
    setImage(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Check if at least one of text, url, or image is provided
  const isValidPost = text.trim() || url.trim() || image;
  const characterCount = text.length;
  const maxCharacters = 280;

  // Get first letter safely for avatar fallback
  const getFirstLetter = (username?: string) => {
    return username && username.length > 0 ? username[0].toUpperCase() : '?';
  };

  // Render avatar
  const renderAvatar = () => {
    const avatar = authState.user?.avatar;
    
    if (avatar && typeof avatar === 'string') {
      if (avatar.startsWith('data:image/') || avatar.startsWith('http')) {
        return (
          <img 
            src={avatar} 
            alt={authState.user?.username} 
            className="w-12 h-12 rounded-full object-cover"
          />
        );
      } else {
        // Emoji avatar
        return (
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-xl">{avatar}</span>
          </div>
        );
      }
    }
    
    // Fallback to first letter
    return (
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="font-semibold text-gray-600">
          {getFirstLetter(authState.user?.username)}
        </span>
      </div>
    );
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {renderAvatar()}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Text Input */}
            <textarea
              className="w-full text-xl placeholder-gray-500 border-none resize-none focus:outline-none"
              placeholder="What's happening?"
              value={text}
              onChange={e => setText(e.target.value)}
              rows={3}
              maxLength={maxCharacters}
            />
            
            {/* URL Input */}
            {showUrlInput && (
              <div className="mt-3">
                <input
                  type="url"
                  className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a link..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
            )}
            
            {/* Image Preview */}
            {image && (
              <div className="mt-3 relative">
                <div className="rounded-2xl overflow-hidden border border-gray-200 relative">
                  <img src={image} alt="Preview" className="w-full max-h-96 object-cover" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 w-8 h-8 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white hover:bg-opacity-80 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
            
            {/* Bottom Bar */}
            <div className="flex items-center justify-between mt-4">
              {/* Action Buttons */}
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-full hover:bg-blue-50 text-blue-500 transition-colors"
                  title="Add photo"
                >
                  <Image size={20} />
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className={`p-2 rounded-full transition-colors ${
                    showUrlInput 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-blue-50 text-blue-500'
                  }`}
                  title="Add link"
                >
                  <Link size={20} />
                </button>
              </div>
              
              {/* Character Count & Post Button */}
              <div className="flex items-center space-x-3">
                {text && (
                  <div className="flex items-center">
                    <div className={`text-sm ${
                      characterCount > maxCharacters * 0.9 
                        ? characterCount > maxCharacters 
                          ? 'text-red-500' 
                          : 'text-yellow-500'
                        : 'text-gray-500'
                    }`}>
                      {maxCharacters - characterCount}
                    </div>
                    <div className="w-8 h-8 ml-2">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-gray-200"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          strokeDashoffset={`${2 * Math.PI * 14 * (1 - characterCount / maxCharacters)}`}
                          className={
                            characterCount > maxCharacters 
                              ? 'text-red-500' 
                              : characterCount > maxCharacters * 0.9
                              ? 'text-yellow-500'
                              : 'text-blue-500'
                          }
                        />
                      </svg>
                    </div>
                  </div>
                )}
                
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-1.5 rounded-full font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isValidPost || characterCount > maxCharacters}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
      </form>
    </div>
  );
};

export default CreatePost; 