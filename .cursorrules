# MetroSocial Project Rules

## Tech Stack
- Frontend: React 18.2.0 with TypeScript, Tailwind CSS 3.2.7, Lucide React icons
- Backend: Node.js with Express 4.18.2, no database (in-memory storage)
- Authentication: JWT with bcryptjs for password hashing
- Real-time: Socket.IO 4.8.1 for WebSocket connections
- Build: Create React App with react-scripts 5.0.1
- HTTP Client: Axios for API calls
- Dev Tools: Nodemon for backend development

## Folder Structure

### Frontend (`src/`)
- `components/` - React components organized by feature
  - `auth/` - Authentication components (Login, Register, Profile, ProtectedRoute)
  - `social/` - Social features (CreatePost, PostFeed, NearbyUsers)
  - `content/` - Content sharing components
- `context/` - React Context providers for state management
  - AuthContext, PostContext, LocationContext, SocketContext, OnlineContext, ContentContext
- `types.ts` - TypeScript type definitions
- `App.tsx` - Main app component
- `index.tsx` - App entry point

### Backend (`backend/src/`)
- `routes/` - Express route handlers (auth.js, users.js, posts.js)
- `models/` - Data models with in-memory storage (users.js)
- `middleware/` - Express middleware (auth.js for JWT verification)
- `index.js` - Server entry point with Socket.IO setup

## Authentication Logic

### JWT Implementation
- Use JWT_SECRET from environment or fallback: 'metrosocial-super-secret-key'
- Token expiration: 24 hours
- Token payload includes: id, userId, email, username, avatar
- Store tokens in localStorage on frontend
- Include both 'id' and 'userId' fields for compatibility

### Auth Middleware Pattern
```javascript
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const currentUser = UserModel.findById(decoded.id || decoded.userId);
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};
```

### Frontend Auth Context Pattern
- Use React Context for global auth state
- Store: user, token, isAuthenticated, loading, error
- Auto-verify token on app load with /api/auth/verify
- Clear localStorage and reset state on logout
- Fetch fresh user data on token verification

## Code Style & Architecture

### TypeScript Conventions
- Use strict TypeScript configuration
- Define comprehensive interfaces in `types.ts`
- Use proper typing for all props and state
- Export interfaces for reuse across components

### React Patterns
- Use functional components with hooks
- Implement custom hooks for complex logic (useAuth, useOnline)
- Use React Context for global state management
- Prefer composition over inheritance
- Use proper error boundaries and loading states

### Component Structure
```tsx
const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  const [localState, setLocalState] = useState<Type>(initialValue);
  const { contextValue } = useContext(SomeContext);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  const handleAction = () => {
    // Event handlers
  };
  
  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};
```

### Styling with Tailwind
- Use custom color palette: primary (#3B82F6), secondary (#F3F4F6), accent (#10B981)
- Responsive design with mobile-first approach
- Use semantic class combinations
- Prefer utility classes over custom CSS
- Use consistent spacing and sizing patterns

## API Routes & Backend Structure

### Route Organization
- `/api/auth/*` - Authentication endpoints (register, login, verify)
- `/api/users/*` - User management (profile, online status)
- `/api/posts/*` - Social posts and interactions
- `/api/location/*` - Location-based features

### Route Handler Pattern
```javascript
router.post('/endpoint', verifyToken, async (req, res) => {
  try {
    // Validate input
    if (!requiredField) {
      return res.status(400).json({ message: 'Validation error' });
    }
    
    // Business logic
    const result = await SomeModel.operation(data);
    
    // Success response
    res.status(200).json({ message: 'Success', data: result });
  } catch (error) {
    // Error handling
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
```

### Data Models (In-Memory)
- Use array-based storage with find/filter operations
- Implement CRUD operations: create, findById, findByEmail, update, getAll
- Hash passwords with bcryptjs (salt rounds: 10)
- Generate unique IDs using Date.now().toString()
- Exclude passwords from response objects

## Error Handling

### Frontend Error Handling
- Use try-catch blocks in async operations
- Store error messages in component/context state
- Display user-friendly error messages
- Handle network errors gracefully
- Implement loading states during async operations

### Backend Error Handling
- Use consistent error response format: `{ message: string, error?: string }`
- Return appropriate HTTP status codes:
  - 400: Bad Request (validation errors)
  - 401: Unauthorized (auth errors)
  - 404: Not Found
  - 409: Conflict (duplicate resources)
  - 500: Internal Server Error
- Log errors to console with detailed information
- Never expose sensitive information in error messages

### Validation Patterns
- Validate required fields before processing
- Check password length (minimum 8 characters)
- Verify user existence before operations
- Validate token presence and format
- Use early returns for validation failures

## Socket.IO Integration
- Initialize Socket.IO server with CORS configuration
- Handle user connection/disconnection events
- Implement room-based messaging (user_${userId})
- Store socket references for real-time features
- Use io instance attached to Express app

## Location & Proximity Features
- Use Haversine formula for distance calculations
- Store user locations in Map data structure
- Implement online/offline status tracking
- Filter nearby users by online status
- Default search radius: 5000 meters

## Development Patterns
- Use nodemon for backend development
- Implement development-only auth bypass with x-skip-auth header
- Use environment variables for configuration
- Maintain separate package.json files for frontend/backend
- Use consistent logging patterns with timestamps

## File Naming Conventions
- React components: PascalCase (UserProfile.tsx)
- Context files: PascalCase with Context suffix (AuthContext.tsx)
- Route files: lowercase (auth.js, users.js)
- Model files: lowercase (users.js)
- Type definitions: camelCase interfaces in types.ts

## Import/Export Patterns
- Use named exports for utilities and types
- Use default exports for React components
- Group imports: external libraries, internal modules, relative imports
- Use index.ts files for clean imports from directories 