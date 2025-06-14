const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');

// In-memory storage for posts
const posts = new Map();
const comments = new Map();

// Debug function to log posts state
const logPostsState = () => {
  console.log(`Current posts in system: ${posts.size}`);
  console.log(`Posts by user:`);
  const postsByUser = {};
  
  for (const [id, post] of posts.entries()) {
    if (!postsByUser[post.userId]) {
      postsByUser[post.userId] = [];
    }
    postsByUser[post.userId].push(id);
  }
  
  for (const [userId, postIds] of Object.entries(postsByUser)) {
    console.log(`User ${userId}: ${postIds.length} posts (${postIds.join(', ')})`);
  }
};

// Log initial state
logPostsState();

// Create a new post
router.post('/', verifyToken, (req, res) => {
  try {
    const { id, text, url, image, createdAt } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Require at least one of: text, url, or image
    if ((!text || text.trim() === '') && (!url || url.trim() === '') && !image) {
      return res.status(400).json({ message: 'Post must include text, URL, or image' });
    }
    
    // Use fresh user data from authentication middleware instead of request body
    const post = {
      id,
      userId: req.user.id,
      username: req.user.username,
      userAvatar: req.user.avatar, // This will always be the latest avatar from database
      text: text || '',
      url,
      image,
      createdAt: createdAt || new Date().toISOString(),
      comments: []
    };
    
    // Store the post
    posts.set(id, post);
    
    console.log(`New post created by ${req.user.username} (${req.user.id}): ${id}`);
    console.log(`Post avatar: ${req.user.avatar ? (typeof req.user.avatar === 'string' && req.user.avatar.startsWith('data:image/') ? 'Image data present' : req.user.avatar) : 'No avatar'}`);
    logPostsState();
    
    // Emit real-time event to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('newPost', post);
      console.log('Emitted newPost event to all connected users');
    }
    
    res.status(201).json({ message: 'Post created', post });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all posts
router.get('/', verifyToken, (req, res) => {
  try {
    console.log(`Getting all posts. Total posts: ${posts.size}`);
    
    // Convert posts Map to array and sort by createdAt (newest first)
    const allPosts = Array.from(posts.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json({ posts: allPosts });
  } catch (error) {
    console.error('Error getting all posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get posts from specific users - no token required for testing purposes
router.get('/users', verifyToken, (req, res) => {
  try {
    const { userIds } = req.query;
    
    if (!userIds) {
      return res.status(400).json({ message: 'Missing userIds parameter' });
    }
    
    console.log(`Posts endpoint called with userIds: ${userIds}`);
    console.log(`Available posts: ${posts.size}`);
    
    // Convert posts Map to array
    const allPosts = Array.from(posts.values());
    console.log(`Converted ${allPosts.length} posts to array`);
    
    // Always return ALL posts to ensure comments work across users
    const userPosts = allPosts
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`Returning all ${userPosts.length} posts to ensure comment visibility`);
    
    // Log all posts with avatar info
    userPosts.forEach(post => {
      let postContent = "empty";
      
      if (post.text && post.text.trim()) {
        postContent = `"${post.text.substring(0, 30)}..."`;
      } else if (post.url) {
        postContent = `[URL: ${post.url.substring(0, 30)}...]`;
      } else if (post.image) {
        postContent = "[IMAGE]";
      }
      
      const avatarInfo = post.userAvatar ? 
        (typeof post.userAvatar === 'string' && post.userAvatar.startsWith('data:image/') ? 
          'has image avatar' : `emoji: ${post.userAvatar}`) : 'no avatar';
      
      console.log(`- Post ${post.id} by ${post.userId} (${avatarInfo}): ${postContent}`);
      
      if (post.comments && post.comments.length > 0) {
        console.log(`  Has ${post.comments.length} comments:`);
        post.comments.forEach((comment, i) => {
          console.log(`    ${i+1}. "${comment.text}" by ${comment.username || comment.userId}`);
        });
      }
    });
    
    res.json({ posts: userPosts });
  } catch (error) {
    console.error('Error getting user posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a comment to a post
router.post('/:postId/comments', verifyToken, (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const username = req.user.username || req.user.email;
    const userAvatar = req.user.avatar;
    
    console.log(`------------------------------`);
    console.log(`Adding comment to post ${postId}`);
    console.log(`Comment text: "${text}"`);
    console.log(`Comment author: ${username} (${userId})`);
    console.log(`Comment author avatar: ${userAvatar ? (typeof userAvatar === 'string' && userAvatar.startsWith('data:image/') ? 'Image data present' : userAvatar) : 'No avatar'}`);
    
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    const post = posts.get(postId);
    
    if (!post) {
      console.log(`Post ${postId} not found for commenting`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create a new comment
    const commentId = Math.random().toString(36).substring(2, 15);
    const comment = {
      id: commentId,
      postId,
      userId,
      username,
      userAvatar,
      text,
      createdAt: new Date().toISOString(),
      replies: [] // Add replies array for nested comments
    };
    
    // Store the comment
    if (!comments.has(postId)) {
      comments.set(postId, []);
    }
    comments.get(postId).push(comment);
    
    // Update the post with the new comment
    post.comments = post.comments || [];
    post.comments.push(comment);
    
    console.log(`Comment successfully added to post ${postId}`);
    console.log(`Post now has ${post.comments.length} comments`);
    console.log(`------------------------------`);
    
    // Emit real-time event to all connected users about the updated post
    const io = req.app.get('io');
    if (io) {
      io.emit('postUpdated', post);
      console.log('Emitted postUpdated event to all connected users');
    }
    
    res.status(201).json({ message: 'Comment added', comment });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a reply to a post (creates a new post)
router.post('/:postId/replies', verifyToken, (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;
    const username = req.user.username || req.user.email;
    const userAvatar = req.user.avatar;
    
    console.log(`------------------------------`);
    console.log(`Adding reply to post ${postId}`);
    console.log(`Reply text: "${text}"`);
    console.log(`Reply author: ${username} (${userId})`);
    
    if (!text) {
      return res.status(400).json({ message: 'Reply text is required' });
    }
    
    const originalPost = posts.get(postId);
    
    if (!originalPost) {
      console.log(`Post ${postId} not found for replying`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Create a new post as a reply (Twitter style)
    const replyPostId = Math.random().toString(36).substring(2, 15);
    const replyPost = {
      id: replyPostId,
      userId,
      username,
      userAvatar,
      text,
      url: undefined,
      image: undefined,
      createdAt: new Date().toISOString(),
      comments: [],
      parentPostId: postId, // Track which post this is replying to
      replyingToUser: originalPost.username // Track who this is replying to
    };
    
    // Store the reply as a new post
    posts.set(replyPostId, replyPost);
    
    // Emit real-time event to all connected users
    const io = req.app.get('io');
    if (io) {
      io.emit('newPost', replyPost);
      console.log('Emitted newPost event for reply to all connected users');
    }
    
    console.log(`Reply created as new post ${replyPostId} in response to post ${postId}`);
    console.log(`------------------------------`);
    
    res.status(201).json({ message: 'Reply created as new post', post: replyPost });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/Unlike a post
router.post('/:postId/like', verifyToken, (req, res) => {
  try {
    const { postId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'
    const userId = req.user.id;
    const username = req.user.username || req.user.email;
    
    console.log(`------------------------------`);
    console.log(`${action === 'like' ? 'Liking' : 'Unliking'} post ${postId}`);
    console.log(`User: ${username} (${userId})`);
    
    const post = posts.get(postId);
    
    if (!post) {
      console.log(`Post ${postId} not found for ${action}`);
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Initialize likes array if it doesn't exist
    if (!post.likes) {
      post.likes = [];
    }
    
    const isCurrentlyLiked = post.likes.includes(userId);
    
    if (action === 'like' && !isCurrentlyLiked) {
      post.likes.push(userId);
      console.log(`User ${username} liked post ${postId}. Total likes: ${post.likes.length}`);
    } else if (action === 'unlike' && isCurrentlyLiked) {
      post.likes = post.likes.filter(id => id !== userId);
      console.log(`User ${username} unliked post ${postId}. Total likes: ${post.likes.length}`);
    } else {
      console.log(`No action needed - user ${username} already ${isCurrentlyLiked ? 'liked' : 'not liked'} post ${postId}`);
    }
    
    // Update likeCount
    post.likeCount = post.likes.length;
    
    // Emit real-time event to all connected users about the updated post
    const io = req.app.get('io');
    if (io) {
      io.emit('postUpdated', post);
      console.log('Emitted postUpdated event for like change to all connected users');
    }
    
    console.log(`Post ${postId} now has ${post.likes.length} likes`);
    console.log(`------------------------------`);
    
    res.json({ 
      message: `Post ${action}d successfully`, 
      likes: post.likes.length,
      isLiked: post.likes.includes(userId)
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comments for a specific post
router.get('/:postId/comments', (req, res) => {
  try {
    const { postId } = req.params;
    const post = posts.get(postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json({ comments: post.comments || [] });
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get the latest post for a specific user
router.get('/user/:userId/latest', verifyToken, (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Getting latest post for user ${userId}`);
    
    // Convert posts Map to array and filter by userId
    const userPosts = Array.from(posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (userPosts.length === 0) {
      return res.json({ latestPost: null });
    }
    
    const latestPost = userPosts[0];
    console.log(`Latest post for user ${userId}: ${latestPost.id} - "${latestPost.text?.substring(0, 50)}..."`);
    
    res.json({ latestPost });
  } catch (error) {
    console.error('Error getting latest post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Debug endpoint to get all posts
router.get('/debug/all', (req, res) => {
  try {
    const allPosts = Array.from(posts.entries()).map(([id, post]) => {
      let contentSummary = "Empty";
      
      if (post.text && post.text.trim()) {
        contentSummary = post.text.substring(0, 30) + (post.text.length > 30 ? "..." : "");
      } else if (post.url) {
        contentSummary = "URL: " + post.url.substring(0, 30) + (post.url.length > 30 ? "..." : "");
      } else if (post.image) {
        contentSummary = "Has image";
      }
      
      return {
        id,
        userId: post.userId,
        username: post.username,
        userAvatar: post.userAvatar,
        contentType: post.text ? "text" : (post.url ? "url" : (post.image ? "image" : "unknown")),
        contentSummary,
        createdAt: post.createdAt,
        commentCount: (post.comments || []).length
      };
    });
    
    res.json({
      totalPosts: allPosts.length,
      posts: allPosts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export function to get posts storage for other modules
const getPostsStorage = () => {
  return posts;
};

module.exports = router;
module.exports.getPostsStorage = getPostsStorage; 