const jwt = require('jsonwebtoken');
const UserModel = require('../models/users');

const JWT_SECRET = process.env.JWT_SECRET || 'metrosocial-super-secret-key';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  console.log('==== VERIFY TOKEN ====');
  console.log('Auth header:', req.headers.authorization ? 'Present' : 'Not present');
  
  // For testing purposes - allow unauthenticated access
  if (process.env.NODE_ENV === 'development' && req.headers['x-skip-auth'] === 'true') {
    console.log('Skipping auth for development');
    req.user = { id: 'test-user', username: 'Test User' };
    return next();
  }

  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    console.log('Attempting to verify token');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Token verification successful');
    console.log('Decoded token payload:', JSON.stringify({
      ...decoded,
      iat: decoded.iat ? 'present' : 'not present',
      exp: decoded.exp ? 'present' : 'not present'
    }));
    
    // Extract the user ID from the token payload, supporting both "id" and "userId" fields
    const id = decoded.id || decoded.userId;
    
    if (!id) {
      console.error('No user ID found in token payload');
      return res.status(401).json({ message: 'Invalid token: no user ID' });
    }
    
    // Fetch fresh user data from database to ensure we have the latest profile information
    const currentUser = UserModel.findById(id);
    
    if (!currentUser) {
      console.error('User not found in database:', id);
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Set user object with fresh data from database
    req.user = {
      id: currentUser.id,
      userId: currentUser.id,
      email: currentUser.email,
      username: currentUser.username,
      name: currentUser.name,
      bio: currentUser.bio,
      avatar: currentUser.avatar // This will always be the latest avatar
    };
    
    console.log('User object set on request with fresh data:', JSON.stringify({
      ...req.user,
      avatar: req.user.avatar ? (typeof req.user.avatar === 'string' && 
        req.user.avatar.startsWith('data:image/') ? 'image data present' : req.user.avatar) : 'no avatar'
    }));
    console.log('==== VERIFY TOKEN COMPLETE ====');
    next();
  } catch (error) {
    console.error('==== TOKEN VERIFICATION ERROR ====');
    console.error('Token verification error:', error.message);
    console.error(error.stack);
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Generate JWT token
const generateToken = (user) => {
  // Make sure we're only including the necessary user fields
  const userInfo = {
    id: user.id || user.userId,
    userId: user.id || user.userId, // Include both id and userId for full compatibility
    email: user.email,
    username: user.username || user.email,
    avatar: user.avatar
  };
  
  console.log('Generating token with payload:', JSON.stringify({
    ...userInfo,
    password: undefined
  }));
  
  return jwt.sign(userInfo, JWT_SECRET, { expiresIn: '24h' });
};

module.exports = {
  verifyToken,
  generateToken,
  JWT_SECRET
}; 