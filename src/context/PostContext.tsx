import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SocialPost, SocialComment } from '../types';
import { useAuth } from './AuthContext';
import { useOnline } from './OnlineContext';
import { useSocket } from './SocketContext';

// API URL - Dynamic based on current host
const getApiUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:5000/api';
  } else {
    // Use the same IP as the frontend but port 5000 for backend
    return `http://${hostname}:5000/api`;
  }
};

const API_URL = getApiUrl();

interface PostContextProps {
  posts: SocialPost[];
  createPost: (data: { text: string; url?: string; image?: string }) => void;
  addComment: (postId: string, text: string) => void;
  addReply: (postId: string, commentId: string, text: string) => void;
  addReplyToPost: (postId: string, text: string) => void;
  toggleLike: (postId: string) => void;
  getPosts: () => SocialPost[];
  getUserPosts: () => SocialPost[];
  getNearbyUsersPosts: () => SocialPost[];
  refreshPosts: (userIds?: string[]) => Promise<void>;
  getLatestUserPost: (userId: string) => Promise<SocialPost | null>;
}

const PostContext = createContext<PostContextProps | undefined>(undefined);

export const PostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const { isOnline } = useOnline();
  const { socket } = useSocket();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [nearbyUsersPosts, setNearbyUsersPosts] = useState<SocialPost[]>([]);

  // Refresh posts from server
  const refreshPosts = useCallback(async (userIds?: string[]) => {
    if (!isOnline || !authState.token) {
      console.log('Cannot refresh posts: offline or no token');
      return;
    }
    
    try {
      console.log('Refreshing posts from server...');
      const response = await fetch(`${API_URL}/posts/users?userIds=${userIds ? userIds.join(',') : 'all'}`, {
        headers: {
          'Authorization': `Bearer ${authState.token}`
        }
      });
      
      if (response.ok) {
        const serverResponse = await response.json();
        const serverPosts = serverResponse.posts || serverResponse;
        console.log(`Received ${serverPosts.length} posts from server`);
        // Ensure serverPosts is always an array
        setNearbyUsersPosts(Array.isArray(serverPosts) ? serverPosts : []);
      } else {
        console.error('Failed to refresh posts:', response.status);
        // Set empty array on error to prevent undefined issues
        setNearbyUsersPosts([]);
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
      // Set empty array on error to prevent undefined issues
      setNearbyUsersPosts([]);
    }
  }, [isOnline, authState.token]);

  // Load local posts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('metrosocial_posts');
    if (stored) setPosts(JSON.parse(stored));
  }, []);

  // Save local posts to localStorage
  useEffect(() => {
    localStorage.setItem('metrosocial_posts', JSON.stringify(posts));
  }, [posts]);

  // Listen for online status changes and refresh posts
  useEffect(() => {
    if (isOnline && authState.user) {
      console.log('User came online, refreshing posts...');
      refreshPosts();
    }
  }, [isOnline, authState.user, refreshPosts]);

  // Add polling to refresh posts every 3 seconds when online
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isOnline && authState.user) {
      console.log('Starting post refresh polling...');
      intervalId = setInterval(() => {
        console.log('Polling: refreshing posts...');
        refreshPosts();
      }, 30000); // Refresh every 30 seconds (reduced from 3 seconds since we have real-time updates)
    }
    
    return () => {
      if (intervalId) {
        console.log('Stopping post refresh polling...');
        clearInterval(intervalId);
      }
    };
  }, [isOnline, authState.user, refreshPosts]);

  // Socket.IO real-time event listeners
  useEffect(() => {
    if (socket) {
      console.log('Setting up Socket.IO event listeners...');
      
      const handleNewPost = (post: SocialPost) => {
        console.log('Received new post via Socket.IO:', post.id);
        setNearbyUsersPosts(prev => {
          // Check if post already exists to avoid duplicates
          const exists = prev.some(p => p.id === post.id);
          if (exists) {
            console.log('Post already exists, skipping duplicate');
            return prev;
          }
          return [post, ...prev];
        });
      };

      const handlePostUpdated = (updatedPost: SocialPost) => {
        console.log('Received post update via Socket.IO:', updatedPost.id);
        setNearbyUsersPosts(prev => 
          prev.map(post => 
            post.id === updatedPost.id ? updatedPost : post
          )
        );
        
        // Also update local posts if it's the user's own post
        setPosts(prev => 
          prev.map(post => 
            post.id === updatedPost.id ? updatedPost : post
          )
        );
      };

      socket.on('newPost', handleNewPost);
      socket.on('postUpdated', handlePostUpdated);

      return () => {
        console.log('Cleaning up Socket.IO event listeners...');
        socket.off('newPost', handleNewPost);
        socket.off('postUpdated', handlePostUpdated);
      };
    }
  }, [socket]);

  // Listen for profile updates to refresh posts
  useEffect(() => {
    const handleProfileUpdated = () => {
      console.log('Profile updated event received - refreshing posts');
      
      // Update local posts with new profile data if they belong to the current user
      if (authState.user) {
        console.log('Updating local posts with new profile data');
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.userId === authState.user!.id) {
              console.log(`Updating post ${post.id} with new avatar:`, 
                authState.user!.avatar ? 
                  (typeof authState.user!.avatar === 'string' && authState.user!.avatar.startsWith('data:image/') ? 
                    'Image data present' : authState.user!.avatar) : 'No avatar');
              return {
                ...post,
                username: authState.user!.username,
                userAvatar: authState.user!.avatar,
                // Also update comments by this user
                comments: post.comments?.map(comment => 
                  comment.userId === authState.user!.id ? {
                    ...comment,
                    username: authState.user!.username,
                    userAvatar: authState.user!.avatar
                  } : comment
                ) || []
              };
            }
            // Update comments by this user in other users' posts
            return {
              ...post,
              comments: post.comments?.map(comment => 
                comment.userId === authState.user!.id ? {
                  ...comment,
                  username: authState.user!.username,
                  userAvatar: authState.user!.avatar
                } : comment
              ) || []
            };
          })
        );
        
        // Also update nearby users posts
        setNearbyUsersPosts(prevPosts => 
          (prevPosts || []).map(post => {
            if (post.userId === authState.user!.id) {
              return {
                ...post,
                username: authState.user!.username,
                userAvatar: authState.user!.avatar,
                comments: post.comments?.map(comment => 
                  comment.userId === authState.user!.id ? {
                    ...comment,
                    username: authState.user!.username,
                    userAvatar: authState.user!.avatar
                  } : comment
                ) || []
              };
            }
            // Update comments by this user in other users' posts
            return {
              ...post,
              comments: post.comments?.map(comment => 
                comment.userId === authState.user!.id ? {
                  ...comment,
                  username: authState.user!.username,
                  userAvatar: authState.user!.avatar
                } : comment
              ) || []
            };
          })
        );
      }
      
      // Refresh posts to get updated profile information from server
      refreshPosts();
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdated);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdated);
    };
  }, [authState.user, refreshPosts]);

  // Post to the backend API
  const postToAPI = async (post: SocialPost) => {
    if (!isOnline || !authState.token) return;
    
    try {
      await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authState.token}`
        },
        body: JSON.stringify(post)
      });
    } catch (error) {
      console.error('Error posting to API:', error);
    }
  };

  // Create a new post
  const createPost = (data: { text: string; url?: string; image?: string }) => {
    if (!authState.user) return;
    
    // Validate that at least one of text, url, or image is provided
    if (!data.text.trim() && !data.url?.trim() && !data.image) {
      console.error('Post must contain text, URL, or image');
      return;
    }
    
    const { id: userId, username, avatar: userAvatar } = authState.user;
    const newPost: SocialPost = {
      id: uuidv4(),
      userId,
      username,
      userAvatar,
      text: data.text ? data.text.trim() : '',
      url: data.url?.trim() || undefined,
      image: data.image,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    
    // Add to local state
    setPosts(prev => [newPost, ...prev]);
    
    // Dispatch postCreated event
    window.dispatchEvent(new CustomEvent('postCreated', { detail: newPost }));
    
    // Post to API if online
    if (isOnline) {
      postToAPI(newPost).then(() => {
        // After posting to API, refresh all posts to ensure all users see the new post
        refreshPosts();
      });
    }
  };

  // Add a comment to a post
  const addComment = async (postId: string, text: string) => {
    if (!authState.user || !text.trim()) return;
    
    const { id: userId, username, avatar: userAvatar } = authState.user;
    
    // Create the comment object
    const newComment: SocialComment = {
      id: uuidv4(),
      postId,
      userId,
      username,
      userAvatar,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };
    
    console.log(`Adding comment "${text}" to post ${postId}`);
    
    // Send comment to API if online
    if (isOnline && authState.token) {
      try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.token}`
          },
          body: JSON.stringify({
            text: text.trim()
          })
        });
        
        if (response.ok) {
          console.log(`Comment successfully added to post ${postId}`);
          
          // After successful comment, trigger a refresh of posts to get the latest data
          // This will fetch the comment from the server and avoid duplicates
          refreshPosts();
        } else {
          console.error(`Error adding comment: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error adding comment to API:', error);
      }
    } else {
      // If offline, add comment locally only
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        return { ...post, comments: [...(post.comments || []), newComment] };
      }));
    }
  };

  // Add a reply to a comment (creates a new post)
  const addReply = async (postId: string, commentId: string, text: string) => {
    if (!authState.user || !text.trim()) return;
    
    console.log(`Adding reply "${text}" to comment ${commentId} in post ${postId}`);
    
    // Send reply to API if online
    if (isOnline && authState.token) {
      try {
        const response = await fetch(`${API_URL}/posts/${postId}/comments/${commentId}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.token}`
          },
          body: JSON.stringify({
            text: text.trim()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Reply successfully created as new post ${data.post?.id}`);
          
          // After successful reply, trigger a refresh of posts to get the latest data
          refreshPosts();
        } else {
          console.error(`Error adding reply: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error adding reply to API:', error);
      }
    } else {
      // If offline, create a local reply post
      console.log(`Creating local reply post...`);
      const { id: userId, username, avatar: userAvatar } = authState.user;
      
      // Find the original post to get the username being replied to
      const allCurrentPosts = getPosts();
      const originalPost = allCurrentPosts.find(p => p.id === postId);
      const replyingToUser = originalPost?.username;
      
      const replyPost: SocialPost = {
        id: uuidv4(),
        userId,
        username,
        userAvatar,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        comments: [],
        parentPostId: postId,
        replyingToUser: replyingToUser,
      };
      
      // Add to local state
      setPosts(prev => [replyPost, ...prev]);
      
      // Dispatch postCreated event for local reply posts
      window.dispatchEvent(new CustomEvent('postCreated', { detail: replyPost }));
    }
  };

  // Add a reply to a post (creates a new post)
  const addReplyToPost = async (postId: string, text: string) => {
    if (!authState.user || !text.trim()) return;
    
    // Send reply to API if online
    if (isOnline && authState.token) {
      try {
        const response = await fetch(`${API_URL}/posts/${postId}/replies`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.token}`
          },
          body: JSON.stringify({
            text: text.trim()
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Reply created successfully: ${data.post?.id}`);
          
          // After successful reply, trigger a refresh of posts to get the latest data
          refreshPosts();
        } else {
          console.error(`Error adding reply: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error adding reply to API:', error);
      }
    } else {
      // If offline, create a local reply post
      const { id: userId, username, avatar: userAvatar } = authState.user;
      
      // Find the original post to get the username being replied to
      const allCurrentPosts = getPosts();
      const originalPost = allCurrentPosts.find(p => p.id === postId);
      const replyingToUser = originalPost?.username;
      
      const replyPost: SocialPost = {
        id: uuidv4(),
        userId,
        username,
        userAvatar,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        comments: [],
        parentPostId: postId,
        replyingToUser: replyingToUser,
      };
      
      console.log(`Local reply created: ${replyPost.id}`);
      
      // Add to local state
      setPosts(prev => [replyPost, ...prev]);
      
      // Dispatch postCreated event for local reply posts
      window.dispatchEvent(new CustomEvent('postCreated', { detail: replyPost }));
    }
  };

  // Toggle like on a post
  const toggleLike = async (postId: string) => {
    if (!authState.user) return;
    
    const { id: userId } = authState.user;
    console.log(`Toggling like for post ${postId} by user ${userId}`);
    
    // Find the post in combined data
    const allPosts = getPosts();
    const targetPost = allPosts.find(p => p.id === postId);
    if (!targetPost) return;
    
    const isCurrentlyLiked = targetPost.likes?.includes(userId) || false;
    
    // Update locally first for immediate feedback
    const updatePostLikes = (posts: SocialPost[]) => 
      posts.map(post => {
        if (post.id !== postId) return post;
        
        const currentLikes = post.likes || [];
        const newLikes = isCurrentlyLiked 
          ? currentLikes.filter(id => id !== userId)
          : [...currentLikes, userId];
        
        return {
          ...post,
          likes: newLikes,
          likeCount: newLikes.length
        };
      });
    
    // Update both local and nearby posts
    setPosts(updatePostLikes);
    setNearbyUsersPosts(prev => updatePostLikes(prev || []));
    
    // Send to API if online
    if (isOnline && authState.token) {
      try {
        const response = await fetch(`${API_URL}/posts/${postId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.token}`
          },
          body: JSON.stringify({
            action: isCurrentlyLiked ? 'unlike' : 'like'
          })
        });
        
        if (response.ok) {
          console.log(`Like ${isCurrentlyLiked ? 'removed' : 'added'} successfully for post ${postId}`);
          // Refresh posts to get the latest like data from server
          refreshPosts();
        } else {
          console.error(`Error toggling like: ${response.status} ${response.statusText}`);
          // Revert the local change if API call failed
          setPosts(updatePostLikes);
          setNearbyUsersPosts(prev => updatePostLikes(prev || []));
        }
      } catch (error) {
        console.error('Error toggling like:', error);
        // Revert the local change if API call failed
        setPosts(updatePostLikes);
        setNearbyUsersPosts(prev => updatePostLikes(prev || []));
      }
    }
  };

  // Get all posts (local + nearby users)
  const getPosts = () => {
    console.log(`Getting all posts - Local: ${posts.length}, Nearby: ${nearbyUsersPosts?.length || 0}`);
    
    // Combine local and nearby posts, removing duplicates
    const allPosts = new Map<string, SocialPost>();
    
    // Add local posts first
    posts.forEach(post => {
      if (post && post.id) {
        allPosts.set(post.id, post);
      }
    });
    
    // Add nearby posts, but prefer server version if it has more recent comments
    // Ensure nearbyUsersPosts is an array before using forEach
    (nearbyUsersPosts || []).forEach(post => {
      if (post && post.id) {
        const existingPost = allPosts.get(post.id);
        if (!existingPost || (post.comments && post.comments.length >= (existingPost.comments?.length || 0))) {
          allPosts.set(post.id, post);
        }
      }
    });
    
    const combinedPosts = Array.from(allPosts.values());
    console.log(`Returning ${combinedPosts.length} combined posts`);
    
    return combinedPosts
      .filter(post => post !== null && post !== undefined)
      .sort((a, b) => {
        try {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } catch (error) {
          console.error('Error sorting posts:', error);
          return 0;
        }
      });
  };

  // Get only the current user's posts
  const getUserPosts = () => {
    if (!authState.user) return [];
    const { id: userId } = authState.user;
    return posts.filter(post => post.userId === userId);
  };

  // Get only posts from nearby users
  const getNearbyUsersPosts = () => {
    return nearbyUsersPosts || [];
  };

  // Get the latest post for a user
  const getLatestUserPost = async (userId: string): Promise<SocialPost | null> => {
    // If online, try to fetch from API first
    if (isOnline && authState.token) {
      try {
        console.log(`Fetching latest post for user ${userId} from API...`);
        const response = await fetch(`${API_URL}/posts/user/${userId}/latest`, {
          headers: {
            'Authorization': `Bearer ${authState.token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Received latest post from API:`, data.latestPost?.id || 'none');
          return data.latestPost;
        } else {
          console.error('Failed to fetch latest post from API:', response.status);
        }
      } catch (error) {
        console.error('Error fetching latest post from API:', error);
      }
    }
    
    // Fallback to local posts
    console.log(`Falling back to local posts for user ${userId}`);
    const allPosts = getPosts();
    const userPosts = allPosts
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return userPosts.length > 0 ? userPosts[0] : null;
  };

  return (
    <PostContext.Provider value={{ 
      posts, 
      createPost, 
      addComment, 
      addReply, 
      addReplyToPost,
      toggleLike,
      getPosts, 
      getUserPosts,
      getNearbyUsersPosts,
      refreshPosts,
      getLatestUserPost
    }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostContext);
  if (!context) throw new Error('usePosts must be used within a PostProvider');
  return context;
}; 