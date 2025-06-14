import React from 'react';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';
import { useOnline } from '../../context/OnlineContext';
import ContentCard from './ContentCard';
import { BookOpen, Trash2, WifiOff } from 'lucide-react';

const UserContent: React.FC = () => {
  const { sharedContents, deleteContent } = useContent();
  const { authState } = useAuth();
  const { isOnline } = useOnline();
  
  // Get user's own content
  const userContent = authState.user 
    ? sharedContents.filter(content => content.userId === authState.user?.id)
    : [];

  const handleDeleteContent = (contentId: string) => {
    if (window.confirm('Are you sure you want to stop sharing this content?')) {
      deleteContent(contentId);
    }
  };

  // If offline, show offline message
  if (!isOnline) {
    return (
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Your Shared Content</h2>
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <WifiOff className="mx-auto text-gray-400 mb-2" size={24} />
          <p className="text-gray-500">Go online to share and manage your content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-4">Your Shared Content</h2>
      
      {userContent.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">You haven't shared any content yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Enable content sharing and browse something to share content
          </p>
        </div>
      ) : (
        <div>
          {userContent.map((content) => (
            <div key={content.contentId} className="relative">
              <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10 flex items-center">
                <BookOpen size={12} className="mr-1" />
                Shared
              </div>
              <button 
                className="absolute top-12 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10 flex items-center"
                onClick={() => handleDeleteContent(content.contentId)}
              >
                <Trash2 size={12} className="mr-1" />
                Stop Sharing
              </button>
              <ContentCard content={content} showInteractions={false} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserContent; 