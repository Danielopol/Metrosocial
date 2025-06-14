import React, { useState, useEffect } from 'react';
import { SocialPost } from '../../types';
import { usePosts } from '../../context/PostContext';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Heart, Repeat2, Share, ArrowLeft } from 'lucide-react';

interface PostCardProps {
  post: SocialPost & { threadLevel?: number; isClickedPost?: boolean };
  allPosts?: SocialPost[];
  isThreadView?: boolean;
  onOpenThread?: (postId: string) => void;
  onBackToFeed?: () => void;
  isMainPostInThread?: boolean;
}

const isEmojiAvatar = (avatar?: string) => {
  return avatar && typeof avatar === 'string' && !avatar.startsWith('data:image/') && !avatar.startsWith('http') && avatar !== '👤';
};

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  allPosts = [], 
  isThreadView = false, 
  onOpenThread,
  onBackToFeed,
  isMainPostInThread = false
}) => {
  const { addReplyToPost, toggleLike, createPost } = usePosts();
  const { authState } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const [showShareNotification, setShowShareNotification] = useState(false);
  const [isReposting, setIsReposting] = useState(false);

  // Like state
  const isLiked = post.likes?.includes(authState.user?.id || '') || false;
  const likeCount = post.likeCount || post.likes?.length || 0;

  // Listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdated = () => {
      setAvatarKey(prev => prev + 1);
    };
    
    const handleProfileUpdated = () => {
      setAvatarKey(prev => prev + 1);
    };
    
    window.addEventListener('avatarUpdated', handleAvatarUpdated);
    window.addEventListener('profileUpdated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdated);
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, []);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addReplyToPost(post.id, commentText);
      setCommentText('');
      setShowCommentForm(false);
    }
  };

  const getFirstLetter = (username?: string) => {
    return username ? username.charAt(0).toUpperCase() : '?';
  };

  const getAvatarSrc = (avatarUrl: string) => {
    // Don't add timestamp to data URLs as it corrupts them
    if (avatarUrl.startsWith('data:image/')) {
      return avatarUrl;
    }
    // Add timestamp for HTTP URLs to prevent caching
    return `${avatarUrl}?t=${avatarKey}`;
  };

  const renderAvatar = (avatar: any, username: string, size: 'large' | 'small' = 'large') => {
    const sizeClasses = size === 'large' ? 'w-12 h-12' : 'w-8 h-8';
    const textSizeClasses = size === 'large' ? 'text-lg' : 'text-sm';

    if (isEmojiAvatar(avatar)) {
      return (
        <div className={`${sizeClasses} rounded-full bg-gray-100 flex items-center justify-center text-2xl`}>
          {avatar}
        </div>
      );
    } else if (avatar && avatar !== '👤') {
      return (
        <img
          src={getAvatarSrc(avatar)}
          alt={`${username}'s avatar`}
          className={`${sizeClasses} rounded-full object-cover`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    } else {
      return (
        <div className={`${sizeClasses} rounded-full bg-gray-200 flex items-center justify-center ${textSizeClasses} font-medium text-gray-600`}>
          {getFirstLetter(username)}
        </div>
      );
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  // Count replies to this post (posts that have this post as parentPostId)
  const replyCount = allPosts.filter(p => p.parentPostId === post.id).length;
  // Total comments = only reply posts now
  const totalComments = replyCount;

  // Thread level styling
  const threadLevel = post.threadLevel || 0;
  const isClickedPost = post.isClickedPost || false;
  const threadIndent = threadLevel * 20; // 20px per level
  const maxIndent = 60; // Maximum indentation to prevent too much nesting
  const actualIndent = Math.min(threadIndent, maxIndent);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(post.id);
  };

  const handleRepost = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!authState.user || isReposting) return;
    
    setIsReposting(true);
    try {
      // Create a repost with reference to original post
      const repostText = `Reposted from @${post.username}:\n\n${post.text}`;
      
      await createPost({
        text: repostText,
        url: post.url,
        image: post.image
      });
      
      // Show success feedback (optional)
      console.log('Reposted successfully');
    } catch (error) {
      console.error('Failed to repost:', error);
    } finally {
      setIsReposting(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Create a shareable link
      const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
      
      // Try to use the Web Share API if available (mobile devices)
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Post by @${post.username}`,
            text: post.text,
            url: shareUrl,
          });
          console.log('Shared successfully via Web Share API');
          return;
        } catch (shareError) {
          console.log('Web Share API failed, falling back to clipboard');
        }
      }
      
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        console.log('Link copied to clipboard');
        setShowShareNotification(true);
        setTimeout(() => setShowShareNotification(false), 2000);
      } catch (clipboardError) {
        console.log('Clipboard API failed, trying legacy copy');
        
        // Legacy fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          console.log('Link copied using legacy method');
          setShowShareNotification(true);
          setTimeout(() => setShowShareNotification(false), 2000);
        } catch (legacyError) {
          console.error('All copy methods failed');
          // Last resort: show an alert with the URL
          alert(`Copy this link to share: ${shareUrl}`);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Share operation failed:', error);
      // Show a fallback alert
      const shareText = `Check out this post by @${post.username}: "${post.text}"`;
      alert(`Share this post:\n${shareText}`);
    }
  };

  return (
    <div className={`border-b border-gray-200 ${isClickedPost && isThreadView ? 'bg-blue-50 border-blue-200' : ''}`}>
      {/* Back button for thread view - only show for main post */}
      {isThreadView && onBackToFeed && isMainPostInThread && (
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={onBackToFeed}
            className="flex items-center text-blue-500 hover:text-blue-600 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      )}

      <article 
        className={`transition-colors hover:bg-gray-50 cursor-pointer ${isClickedPost && isThreadView ? 'bg-blue-50' : ''}`}
        style={{ paddingLeft: `${16 + actualIndent}px`, paddingRight: '16px', paddingTop: '16px', paddingBottom: '16px' }}
        onClick={() => {
          if (onOpenThread) {
            onOpenThread(post.id);
          }
        }}
      >
        {/* Thread line indicator for nested posts */}
        {isThreadView && threadLevel > 0 && (
          <div 
            className="absolute border-l-2 border-gray-200"
            style={{ 
              left: `${16 + 24}px`, // Position the line at the main post's avatar center
              top: '0',
              bottom: '0',
              width: '2px'
            }}
          />
        )}

        <div className="flex space-x-3 relative">
          {/* Avatar */}
          <div className="flex-shrink-0 relative z-10">
            {renderAvatar(post.userAvatar, post.username)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Clicked post indicator */}
            {isClickedPost && isThreadView && (
              <div className="text-blue-600 text-xs font-medium mb-2 flex items-center">
                <span className="bg-blue-100 px-2 py-1 rounded-full">You clicked this post</span>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-bold text-gray-900">{post.username}</span>
              <span className="text-gray-500">@{post.username.toLowerCase()}</span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">{formatTimestamp(post.createdAt)}</span>
              {/* Thread level indicator */}
              {isThreadView && threadLevel > 0 && (
                <>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-400 text-xs">Level {threadLevel}</span>
                </>
              )}
            </div>

            {/* Reply indicator */}
            {post.parentPostId && post.replyingToUser && (
              <div className="text-gray-500 text-sm mb-2">
                Replying to <span className="text-blue-500">@{post.replyingToUser}</span>
              </div>
            )}

            {/* Post content */}
            {post.text && (
              <div className="text-gray-900 mb-3 whitespace-pre-wrap">
                {post.text}
              </div>
            )}

            {/* URL preview */}
            {post.url && (
              <div className="mb-3">
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="text-blue-600 hover:underline break-all">
                    {post.url}
                  </div>
                </a>
              </div>
            )}

            {/* Image */}
            {post.image && (
              <div className="mb-3">
                <img
                  src={post.image}
                  alt="Post content"
                  className="rounded-lg max-w-full h-auto border border-gray-200"
                />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between max-w-md mt-3">
              {/* Comment/Reply button - now opens reply form directly */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent post click
                  // Always open reply form on comment button click
                  setShowCommentForm(!showCommentForm);
                }}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group relative"
                title="Reply to this post"
              >
                <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                {totalComments > 0 && (
                  <span className="text-sm">{totalComments}</span>
                )}
              </button>

              <button 
                onClick={handleLike}
                className={`flex items-center space-x-2 transition-colors group relative ${
                  isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                }`}
                title={isLiked ? "Unlike this post" : "Like this post"}
              >
                <div className={`p-2 rounded-full transition-colors ${
                  isLiked ? 'bg-red-50' : 'group-hover:bg-red-50'
                }`}>
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                </div>
                {likeCount > 0 && (
                  <span className="text-sm">{likeCount}</span>
                )}
              </button>

              <button 
                onClick={handleRepost}
                disabled={isReposting}
                className={`flex items-center space-x-2 transition-colors group relative ${
                  isReposting 
                    ? 'text-green-600 cursor-not-allowed' 
                    : 'text-gray-500 hover:text-green-500'
                }`}
                title={isReposting ? "Reposting..." : "Repost this post"}
              >
                <div className={`p-2 rounded-full transition-colors ${
                  isReposting ? 'bg-green-100' : 'group-hover:bg-green-50'
                }`}>
                  <Repeat2 className={`w-5 h-5 ${isReposting ? 'animate-pulse' : ''}`} />
                </div>
                {isReposting && <span className="text-sm">Reposting...</span>}
              </button>

              <button 
                onClick={handleShare}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors group relative"
                title="Share this post"
              >
                <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                  <Share className="w-5 h-5" />
                </div>
                
                {/* Share notification */}
                {showShareNotification && (
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    Copied to clipboard!
                  </div>
                )}
              </button>
            </div>

            {/* View replies link - shows when there are replies and we're not in thread view */}
            {!isThreadView && totalComments > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenThread) {
                    onOpenThread(post.id);
                  }
                }}
                className="text-blue-500 hover:text-blue-600 text-sm mt-2 hover:underline"
              >
                View {totalComments} {totalComments === 1 ? 'reply' : 'replies'}
              </button>
            )}

            {/* Reply form - now shows in both main feed and thread view */}
            {showCommentForm && (
              <form onSubmit={handleComment} className="mt-4 border-t border-gray-100 pt-4">
                <div className="text-gray-500 text-sm mb-3">
                  Replying to <span className="text-blue-500">@{post.username}</span>
                </div>
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    {renderAvatar(authState.user?.avatar, authState.user?.username || '', 'small')}
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Tweet your reply"
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2 space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowCommentForm(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!commentText.trim()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </article>
    </div>
  );
};

export default PostCard; 