const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const UserModel = require('../models/users');
const { generateToken, verifyToken } = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email and password' });
    }
    
    // Check password length according to PRD requirements
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    
    // Additional password validation could be added here
    
    // Create user
    const user = await UserModel.create({
      username,
      email,
      password,
      name: name || username,
    });
    
    // Generate token with full user information
    const token = generateToken(user);
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user
    });
  } catch (error) {
    if (error.message === 'User with this email already exists') {
      return res.status(409).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find user
    const user = UserModel.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate token with full user information
    const token = generateToken(user);
    
    // Return user info (except password)
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify token and get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    // The token is verified in the auth middleware
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
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

// Alias for /me endpoint - frontend is using /verify
router.get('/verify', verifyToken, async (req, res) => {
  try {
    console.log('==== VERIFY TOKEN ENDPOINT ====');
    // The token is verified in the auth middleware
    const userId = req.user.id;
    
    if (!userId) {
      console.log('No user ID in token');
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    console.log('Looking up user with ID:', userId);
    const user = UserModel.findById(userId);
    
    if (!user) {
      console.log('User not found with ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Return user info (except password)
    const { password, ...userWithoutPassword } = user;
    
    console.log('User found, returning data:', JSON.stringify({
      ...userWithoutPassword,
      passwordExists: !!password
    }));
    
    res.json({
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Error in verify endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 