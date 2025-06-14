import React, { useState } from 'react';
import { usePosts } from '../../context/PostContext';
import { useOnline } from '../../context/OnlineContext';
import { useAuth } from '../../context/AuthContext';
import PostCard from './PostCard';
import { Sparkles } from 'lucide-react';

interface ThreadStackItem {
  postId: string;
  post: any;
}

const PostFeed: React.FC = () => {
  const { getPosts } = usePosts();
  const { isOnline } = useOnline();
  const { authState } = useAuth();
  // Navigation stack for nested threads
  const [threadStack, setThreadStack] = useState<ThreadStackItem[]>([]);
  
  const allPosts = getPosts();
  
  // Get current thread (top of stack) or null if in main feed
  const currentThread = threadStack.length > 0 ? threadStack[threadStack.length - 1] : null;
  
  // Timeline filtering logic (Twitter/X style):
  // - Show my posts (both main posts and replies)
  // - Show other users' main posts only (hide their replies from timeline)
  // - In thread view, show the main post + all its replies
  const getTimelinePosts = () => {
    if (!authState.user) return [];
    
    const currentUserId = authState.user.id;
    
    return allPosts.filter(post => {
      // Always show my posts (both main posts and replies)
      if (post.userId === currentUserId) {
        return true;
      }
      
      // For other users, only show main posts (not replies)
      return !post.parentPostId;
    });
  };

  const getThreadPosts = (mainPostId: string) => {
    const clickedPost = allPosts.find(p => p.id === mainPostId);
    if (!clickedPost) return [];
    
    // The clicked post becomes the main post of this thread view
    const threadPosts: any[] = [];
    
    // Add the clicked post as the main post (level 0)
    threadPosts.push({ 
      ...clickedPost, 
      threadLevel: 0, 
      isClickedPost: true
    });
    
    // Get only the direct replies to the clicked post (level 1)
    const directReplies = allPosts
      .filter(post => post.parentPostId === mainPostId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Oldest first for thread order
    
    // Add direct replies with level 1
    directReplies.forEach((reply, index) => {
      threadPosts.push({ 
        ...reply, 
        threadLevel: 1,
        isClickedPost: false
      });
    });
    
    return threadPosts;
  };

  // Get posts to display based on current view
  const postsToDisplay = currentThread 
    ? getThreadPosts(currentThread.postId)
    : getTimelinePosts();

  const handleOpenThread = (postId: string) => {
    // For nested threading: treat the clicked post as the main post of its own thread
    const clickedPost = allPosts.find(p => p.id === postId);
    if (!clickedPost) return;
    
    // Use the clicked post itself as the main post (not its parent)
    setThreadStack([...threadStack, { postId: clickedPost.id, post: clickedPost }]);
  };

  const handleBackToFeed = () => {
    setThreadStack(threadStack.slice(0, -1));
  };

  return (
    <div className="bg-white">
      {/* Thread breadcrumb navigation (only show when in thread view) */}
      {threadStack.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <button
              onClick={() => setThreadStack([])}
              className="hover:text-blue-500 transition-colors"
            >
              Feed
            </button>
            {threadStack.map((thread, index) => (
              <React.Fragment key={thread.postId}>
                <span>›</span>
                <button
                  onClick={() => setThreadStack(threadStack.slice(0, index + 1))}
                  className={`hover:text-blue-500 transition-colors ${
                    index === threadStack.length - 1 ? 'text-gray-900 font-medium' : ''
                  }`}
                >
                  {thread.post.username}'s post
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="divide-y divide-gray-200">
        {postsToDisplay.length > 0 ? (
          postsToDisplay.map((post, index) => (
            <PostCard 
              key={post.id} 
              post={post} 
              allPosts={allPosts}
              isThreadView={!!currentThread}
              onOpenThread={handleOpenThread}
              onBackToFeed={handleBackToFeed}
              isMainPostInThread={!!currentThread && index === 0}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-gray-400 mb-4">
              <Sparkles className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isOnline ? "Welcome to MetroSocial!" : "You're offline"}
            </h3>
            <p className="text-gray-500 text-center max-w-sm">
              {isOnline 
                ? "Start sharing your thoughts and connect with people nearby."
                : "Check your connection and try again."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostFeed; 