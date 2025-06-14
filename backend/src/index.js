const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postsRoutes = require('./routes/posts');
const { verifyToken } = require('./middleware/auth');
const UserModel = require('./models/users');

// Initialize express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.0.101:3000"],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Make io available to routes
app.set('io', io);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://192.168.0.101:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma', 'Expires'],
  credentials: true
}));
// Increase payload size limit for image uploads (set to 10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/posts', postsRoutes);

const userLocations = new Map();
const onlineUsers = new Map(); // userId -> { ...user, lastSeen: Date }

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

app.post('/api/location', verifyToken, (req, res) => {
  const { userId, username, avatar, location } = req.body;
  if (!userId || !location) return res.status(400).json({ error: 'Missing userId or location' });
  userLocations.set(userId, { username, avatar, location, lastUpdated: Date.now() });
  console.log(`User ${username} (${userId}) reported location at ${new Date().toISOString()}`);
  console.log(`Current user locations: ${userLocations.size}`);
  res.json({ success: true });
});

app.post('/api/users/online', verifyToken, (req, res) => {
  const user = req.user;
  onlineUsers.set(user.id, { ...user, lastSeen: Date.now() });
  res.json({ success: true });
});

app.post('/api/users/offline', verifyToken, (req, res) => {
  const user = req.user;
  onlineUsers.delete(user.id);
  res.json({ success: true });
});

app.get('/api/location/nearby', verifyToken, (req, res) => {
  const { userId, latitude, longitude, radius = 5000 } = req.query;
  if (!userId || !latitude || !longitude) return res.status(400).json({ error: 'Missing params' });

  console.log(`Finding nearby users for ${userId} at [${latitude}, ${longitude}]`);
  console.log(`Available online users: ${Array.from(onlineUsers.keys()).join(', ')}`);
  console.log(`Available user locations: ${Array.from(userLocations.keys()).join(', ')}`);

  const results = [];
  for (const [id, user] of userLocations.entries()) {
    if (id === userId) continue;
    // Only include if user is online
    if (!onlineUsers.has(id)) {
      console.log(`User ${id} (${user.username}) has location but is not online`);
      continue;
    }

    const dist = haversine(
      parseFloat(latitude), parseFloat(longitude),
      user.location.latitude, user.location.longitude
    );

    console.log(`Distance to ${user.username}: ${Math.round(dist)}m`);

    if (dist <= radius) {
      // Get full user data from the database
      const fullUserData = UserModel.findById(id);
      
      results.push({
        id: id,
        userId: id,
        username: user.username,
        name: fullUserData?.name || user.username,
        bio: fullUserData?.bio || '',
        avatar: user.avatar,
        location: user.location,
        distance: dist
      });
    }
  }

  console.log(`Returning ${results.length} nearby users`);
  res.json({ users: results });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Protected test route
app.get('/api/protected', verifyToken, (req, res) => {
  res.json({ 
    message: 'This is a protected route', 
    user: req.user 
  });
});

// Debug endpoint to view all users and locations
app.get('/api/debug', (req, res) => {
  const users = Array.from(userLocations.entries()).map(([id, data]) => ({
    userId: id,
    username: data.username,
    location: data.location,
    lastUpdated: new Date(data.lastUpdated).toISOString()
  }));
  
  res.json({ 
    users,
    totalUsers: users.length
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', (userId) => {
    socket.userId = userId;
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} and accessible on local network`);
}); 