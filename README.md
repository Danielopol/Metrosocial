# MetroSocial

A revolutionary proximity-based social networking application that connects people based on their physical location, allowing users to see what others nearby are sharing and interact with their content in real-time.

## 🌟 Key Features

### 🎯 Latest Message Display
- **Prominent profile integration**: Latest user messages displayed with eye-catching blue gradient design
- **Real-time updates**: Automatically refreshes when users post new content
- **Multi-format support**: Displays text posts, shared URLs, and images
- **Cross-platform visibility**: Shows in both main profile and proximity layer modals

### 🗺️ Proximity-Based Networking
- **Interactive proximity layers**: Visual representation of users in intimate, personal, social, and public zones
- **Real-time location tracking**: Dynamic user positioning based on actual GPS coordinates
- **Distance-based interactions**: Different interaction levels based on physical proximity
- **Responsive visualization**: Optimized for both desktop and mobile devices

### 💬 Social Interaction Features
- **Real-time posting**: Create and share text, URLs, and images instantly
- **Live commenting system**: Engage with posts through threaded conversations
- **Like/unlike functionality**: Express appreciation for content
- **Reply threading**: Twitter-style reply system with visual threading
- **Content sharing**: Share links and images with automatic preview generation

### 👤 Advanced Profile Management
- **Customizable avatars**: Upload images or choose from emoji options
- **Bio and personal info**: Comprehensive profile customization
- **Online/offline status**: Real-time presence indicators
- **Profile editing**: Seamless in-app profile updates

### 🔄 Real-Time Features
- **Socket.IO integration**: Instant updates across all connected users
- **Live user discovery**: Real-time nearby user detection
- **Instant notifications**: Immediate feedback for all social interactions
- **Synchronized state**: Consistent experience across all devices

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** with TypeScript for type-safe development
- **Tailwind CSS 3.2.7** for modern, responsive styling
- **Lucide React** for consistent iconography
- **Socket.IO Client** for real-time communication
- **Axios** for HTTP requests
- **UUID** for unique identifier generation

### Backend
- **Node.js** with Express 4.18.2 framework
- **Socket.IO 4.8.1** for WebSocket connections
- **JWT authentication** with bcryptjs password hashing
- **In-memory storage** for rapid development and testing
- **CORS enabled** for cross-origin requests

### Development Tools
- **Create React App** with react-scripts 5.0.1
- **Nodemon** for backend development
- **TypeScript** for enhanced development experience
- **ESLint** for code quality

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Modern web browser with geolocation support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Danielopol/Metrosocial.git
   cd Metrosocial
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Start the backend server**
   ```bash
   npm start
   # Server runs on http://localhost:5000
   ```

5. **Start the frontend application** (in a new terminal)
   ```bash
   cd ..
   npm start
   # Application runs on http://localhost:3000
   ```

6. **Enable location services** when prompted by your browser

## 📱 Usage

### Getting Started
1. **Register/Login**: Create an account or sign in with existing credentials
2. **Set up profile**: Upload an avatar and add your bio
3. **Enable location**: Allow the app to access your location for proximity features
4. **Go online**: Toggle your online status to appear to nearby users

### Social Features
- **Create posts**: Share text, links, or images with nearby users
- **Interact**: Like, comment, and reply to posts from people around you
- **Discover**: See who's nearby through the interactive proximity layers
- **Connect**: View profiles and latest messages from other users

### Proximity Layers
- **Intimate Zone** (0-10m): Close personal interactions
- **Personal Zone** (10-50m): Friends and acquaintances  
- **Social Zone** (50-200m): Broader social circle
- **Public Zone** (200m+): Public interactions

## 🎨 Screenshots

- **Proximity Layers**: Interactive visualization of nearby users
- **Profile with Latest Message**: Prominent display of user's most recent post
- **Real-time Feed**: Live updating social feed
- **Mobile Interface**: Responsive design for all devices

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `GET /api/posts/user/:userId/latest` - Get user's latest post
- `POST /api/posts/:postId/comments` - Add comment
- `POST /api/posts/:postId/like` - Like/unlike post

### Users & Location
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/location` - Report user location
- `GET /api/location/nearby` - Get nearby users

## 🌐 Real-Time Events

### Socket.IO Events
- `newPost` - New post created
- `postUpdated` - Post liked or commented
- `userOnline` - User came online
- `userOffline` - User went offline
- `locationUpdate` - User location changed

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Daniel Valentin**
- GitHub: [@Danielopol](https://github.com/Danielopol)
- Project: [MetroSocial](https://github.com/Danielopol/Metrosocial)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🔮 Future Enhancements

- Push notifications for mobile devices
- Private messaging system
- Event creation and discovery
- Business/location check-ins
- Advanced privacy controls
- Multi-language support

---

**MetroSocial** - Connecting people through proximity, one interaction at a time. 🌍 