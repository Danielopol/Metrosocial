import React from 'react';
import { useContent } from '../../context/ContentContext';
import { useOnline } from '../../context/OnlineContext';
import ContentCard from './ContentCard';
import { Radio, WifiOff } from 'lucide-react';

const ContentFeed: React.FC = () => {
  const { getNearbyContent, isContentDetectionEnabled } = useContent();
  const { isOnline } = useOnline();
  const nearbyContent = getNearbyContent();

  // If offline, show offline message
  if (!isOnline) {
    return (
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Nearby Content</h2>
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <WifiOff className="mx-auto text-gray-400 mb-2" size={24} />
          <p className="text-gray-500">Go online to discover content from people nearby</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h2 className="text-xl font-bold mb-4">Nearby Content</h2>
      
      {!isContentDetectionEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-center">
            <Radio size={20} className="text-yellow-500 mr-2" />
            <p className="text-sm text-yellow-700">
              Enable content sharing to discover what nearby users are browsing
            </p>
          </div>
        </div>
      )}
      
      {nearbyContent.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No content available from nearby users yet</p>
          <p className="text-sm text-gray-400 mt-2">
            {isContentDetectionEnabled 
              ? 'Try again later or add another account to share content for testing'
              : 'Enable content sharing to discover content from nearby users'
            }
          </p>
        </div>
      ) : (
        <div>
          {nearbyContent.map((content) => (
            <ContentCard key={content.contentId} content={content} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentFeed; 