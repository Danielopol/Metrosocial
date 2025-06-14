const express = require('express');
const router = express.Router();
const UserModel = require('../models/users');

// Get user profile
router.get('/profile', (req, res) => {
  try {
    // Support both id and userId properties for maximum compatibility
    const userId = req.user.id || req.user.userId;
    const user = UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user info (except password)
    const { password, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', (req, res) => {
  try {
    console.log('==== PROFILE UPDATE REQUEST ====');
    console.log('Request user object:', JSON.stringify(req.user));
    console.log('Token from headers:', req.headers.authorization);
    
    // Support both id and userId properties for maximum compatibility
    const userId = req.user.id || req.user.userId;
    console.log('Using userId:', userId);
    
    if (!userId) {
      console.error('No user ID found in request user object');
      return res.status(401).json({ message: 'User ID not found in authentication token' });
    }
    
    const { username, name, bio, avatar } = req.body;
    
    // Log the update request
    console.log(`Updating profile for user ${userId}`);
    console.log('Request body:', JSON.stringify({
      ...req.body,
      avatar: req.body.avatar ? (typeof req.body.avatar === 'string' && 
        req.body.avatar.startsWith('data:image/') ? 'image data (truncated)' : req.body.avatar) : null
    }));
    
    // Ensure the avatar field is properly handled
    const userData = {
      username,
      name,
      bio,
      avatar
    };
    
    // Remove undefined fields
    Object.keys(userData).forEach(key => {
      if (userData[key] === undefined) {
        delete userData[key];
      }
    });
    
    console.log('Processed user data for update:', JSON.stringify({
      ...userData,
      avatar: userData.avatar ? (typeof userData.avatar === 'string' && 
        userData.avatar.startsWith('data:image/') ? 'image data exists' : userData.avatar) : null
    }));
    
    // Update the user
    const updatedUser = UserModel.update(userId, userData);
    
    console.log('User updated successfully');
    
    // Update all existing posts by this user with new avatar/username
    updateUserPostsProfile(userId, {
      username: updatedUser.username,
      userAvatar: updatedUser.avatar
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Function to update all posts by a user when their profile changes
const updateUserPostsProfile = (userId, profileData) => {
  try {
    console.log('==== UPDATING USER POSTS PROFILE ====');
    console.log(`Updating posts for user ${userId} with new profile data:`, JSON.stringify({
      ...profileData,
      userAvatar: profileData.userAvatar ? (typeof profileData.userAvatar === 'string' && 
        profileData.userAvatar.startsWith('data:image/') ? 'image data exists' : profileData.userAvatar) : null
    }));
    
    // Import posts storage from posts route (we'll need to make this accessible)
    // For now, we'll use a simple approach by requiring the posts module
    const postsModule = require('./posts');
    const posts = postsModule.getPostsStorage();
    
    let updatedCount = 0;
    
    // Update all posts by this user
    for (const [postId, post] of posts.entries()) {
      if (post.userId === userId) {
        // Update post with new profile data
        post.username = profileData.username;
        post.userAvatar = profileData.userAvatar;
        
        // Also update comments by this user in all posts
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach(comment => {
            if (comment.userId === userId) {
              comment.username = profileData.username;
              comment.userAvatar = profileData.userAvatar;
            }
          });
        }
        
        updatedCount++;
      } else {
        // Update comments by this user in other users' posts
        if (post.comments && post.comments.length > 0) {
          post.comments.forEach(comment => {
            if (comment.userId === userId) {
              comment.username = profileData.username;
              comment.userAvatar = profileData.userAvatar;
            }
          });
        }
      }
    }
    
    console.log(`Updated ${updatedCount} posts and all comments by user ${userId}`);
    console.log('==== USER POSTS PROFILE UPDATE COMPLETE ====');
  } catch (error) {
    console.error('Error updating user posts profile:', error);
  }
};

// Get all users (for testing)
router.get('/', (req, res) => {
  try {
    const users = UserModel.getAll();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 