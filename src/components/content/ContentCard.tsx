import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, ExternalLink, Calendar, Clock } from 'lucide-react';
import { SharedContent, ContentInteraction } from '../../types';
import { useContent } from '../../context/ContentContext';
import { useAuth } from '../../context/AuthContext';

interface ContentCardProps {
  content: SharedContent;
  showInteractions?: boolean;
}

const ContentCard: React.FC<ContentCardProps> = ({ content, showInteractions = true }) => {
  const { likeContent, commentOnContent, shareContent, interactions } = useContent();
  const { authState } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Check if the current user has liked this content
  const hasLiked = authState.user && interactions.some(
    (interaction) => 
      interaction.contentId === content.contentId && 
      interaction.userId === authState.user?.id &&
      interaction.type === 'like'
  );

  // Get comments for this content
  const contentComments = interactions
    .filter(
      (interaction) => 
        interaction.contentId === content.contentId && 
        interaction.type === 'comment'
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleLikeClick = () => {
    likeContent(content.contentId);
  };

  const handleCommentClick = () => {
    setShowCommentInput(!showCommentInput);
  };

  const handleShareClick = () => {
    shareContent(content.contentId, 'clipboard');
    alert('Content link copied to clipboard!');
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    commentOnContent(content.contentId, commentText);
    setCommentText('');
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);

    if (diffSec < 60) {
      return `${diffSec} seconds ago`;
    } else if (diffMin < 60) {
      return `${diffMin} minutes ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hours ago`;
    } else {
      return formatDate(dateString);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
      {/* User info */}
      <div className="flex items-center p-3 border-b border-gray-200">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden mr-3">
          {content.userAvatar && content.userAvatar.startsWith('data:image/') ? (
            <img src={content.userAvatar} alt={content.username} className="w-full h-full object-cover" />
          ) : (
            content.userAvatar || '👤'
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium">{content.username}</p>
          <div className="flex items-center text-xs text-gray-500">
            <Clock size={12} className="mr-1" />
            <span>{getTimeAgo(content.createdAt)}</span>
            <span className="mx-2">•</span>
            <span>{content.source.appName}</span>
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div className="p-3">
        <h3 className="font-semibold text-lg mb-2">{content.metadata.title}</h3>
        <p className="text-gray-700 text-sm mb-3">{content.metadata.description}</p>
        
        {content.preview.hasMedia && content.preview.imagePreview && (
          <div className="mb-3 rounded overflow-hidden">
            <img 
              src={content.preview.imagePreview} 
              alt={content.metadata.title}
              className="w-full h-auto"
            />
          </div>
        )}
        
        <div className="flex items-center text-xs text-gray-500 mb-2">
          {content.metadata.author && (
            <span className="mr-2">{content.metadata.author}</span>
          )}
          {content.metadata.publishedAt && (
            <>
              <Calendar size={12} className="mr-1" />
              <span>{formatDate(content.metadata.publishedAt)}</span>
            </>
          )}
          {content.metadata.duration && (
            <span className="ml-2">{Math.floor(content.metadata.duration / 60)}:{(content.metadata.duration % 60).toString().padStart(2, '0')}</span>
          )}
        </div>

        <div className="flex items-center text-xs">
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 mr-2">
            {content.contentType}
          </span>
          <span className="px-2 py-1 bg-gray-100 rounded text-gray-600">
            {content.metadata.category}
          </span>
        </div>
      </div>

      {/* Interaction buttons */}
      {showInteractions && (
        <div className="flex border-t border-gray-200 divide-x divide-gray-200">
          <button 
            className={`flex-1 flex items-center justify-center py-2 text-sm ${hasLiked ? 'text-red-500' : 'text-gray-600'} hover:bg-gray-50`}
            onClick={handleLikeClick}
          >
            <Heart size={16} className={`mr-1 ${hasLiked ? 'fill-red-500' : ''}`} />
            <span>{content.statistics.likes > 0 ? content.statistics.likes : ''} Like</span>
          </button>
          <button 
            className={`flex-1 flex items-center justify-center py-2 text-sm ${showCommentInput ? 'text-blue-500' : 'text-gray-600'} hover:bg-gray-50`}
            onClick={handleCommentClick}
          >
            <MessageSquare size={16} className="mr-1" />
            <span>{content.statistics.comments > 0 ? content.statistics.comments : ''} Comment</span>
          </button>
          <button 
            className="flex-1 flex items-center justify-center py-2 text-sm text-gray-600 hover:bg-gray-50"
            onClick={handleShareClick}
          >
            <Share2 size={16} className="mr-1" />
            <span>Share</span>
          </button>
          <a 
            href={content.source.url || "#"} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink size={16} className="mr-1" />
            <span>View</span>
          </a>
        </div>
      )}

      {/* Comments section */}
      {showInteractions && showCommentInput && (
        <div className="p-3 bg-gray-50">
          <form onSubmit={handleSubmitComment} className="mb-3">
            <div className="flex">
              <input
                type="text"
                placeholder="Write a comment..."
                className="flex-1 p-2 rounded-l border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button 
                type="submit"
                className="bg-blue-500 text-white px-4 rounded-r"
                disabled={!commentText.trim()}
              >
                Post
              </button>
            </div>
          </form>

          {contentComments.length > 0 && (
            <div className="space-y-2">
              {contentComments.map((comment: ContentInteraction) => (
                <div key={comment.interactionId} className="bg-white p-2 rounded shadow-sm">
                  <div className="text-xs text-gray-500 mb-1">
                    {comment.userId === authState.user?.id ? 'You' : 'User'} • {getTimeAgo(comment.createdAt)}
                  </div>
                  <p className="text-sm">{comment.data?.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContentCard; 