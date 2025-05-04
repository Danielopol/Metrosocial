const express = require('express');
const router = express.Router();
const UserModel = require('../models/users');

// Get user profile
router.get('/profile', (req, res) => {
  try {
    const userId = req.user.userId;
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
    const userId = req.user.userId;
    const { username, name, bio, avatar } = req.body;
    
    // Update user
    const updatedUser = UserModel.update(userId, {
      username,
      name,
      bio,
      avatar
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    if (error.message === 'User not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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