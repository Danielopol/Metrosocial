const bcrypt = require('bcryptjs');

// In-memory user database for quick prototyping
// In a real application, this would be a database like MongoDB or PostgreSQL
let users = [
  {
    id: '1',
    username: 'user1',
    email: 'user1@example.com',
    password: '$2a$10$XFYxlNWYbkUzRqwHGNZpPuLnOX9JVULZfOJFHnJ6Y1rMI2PEtfOje', // password123
    name: 'John Doe',
    bio: 'Software developer and tech enthusiast',
    avatar: '👨‍💻',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'user2',
    email: 'user2@example.com',
    password: '$2a$10$XFYxlNWYbkUzRqwHGNZpPuLnOX9JVULZfOJFHnJ6Y1rMI2PEtfOje', // password123
    name: 'Jane Smith',
    bio: 'Digital artist and designer',
    avatar: '👩‍🎨',
    createdAt: new Date().toISOString()
  }
];

// Find user by email
const findByEmail = (email) => {
  return users.find(user => user.email === email);
};

// Find user by ID
const findById = (id) => {
  return users.find(user => user.id === id);
};

// Create new user
const create = async (userData) => {
  // Check if user already exists
  if (findByEmail(userData.email)) {
    throw new Error('User with this email already exists');
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const newUser = {
    id: Date.now().toString(),
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    name: userData.name || userData.username,
    bio: userData.bio || '',
    avatar: userData.avatar || '👤',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  return { ...newUser, password: undefined }; // Return user without password
};

// Update user
const update = (id, userData) => {
  console.log('==== USER MODEL UPDATE ====');
  console.log('Looking for user with ID:', id);
  
  const index = users.findIndex(user => user.id === id);
  
  console.log('User index in array:', index);
  
  if (index === -1) {
    console.error('USER NOT FOUND:', id);
    console.log('Current users in system:', users.map(u => `${u.id} (${u.username})`).join(', '));
    throw new Error('User not found');
  }

  // Don't update password through this method
  const { password, ...updateData } = userData;
  
  // Log what's being updated
  console.log('Updating user:', id);
  console.log('Current user data:', JSON.stringify({
    ...users[index],
    password: '***REDACTED***'
  }));
  
  console.log('Update fields:', JSON.stringify(updateData));
  
  // Allow fields to be set to null or empty string, but not undefined
  const cleanUpdateData = {};
  Object.keys(updateData).forEach(key => {
    if (updateData[key] !== undefined) { // Allow null and empty strings
      cleanUpdateData[key] = updateData[key];
    }
  });
  
  console.log('Clean update data:', JSON.stringify({
    ...cleanUpdateData,
    avatar: cleanUpdateData.avatar ? (typeof cleanUpdateData.avatar === 'string' && 
      cleanUpdateData.avatar.startsWith('data:image/') ? 'image data exists' : cleanUpdateData.avatar) : null
  }));
  
  // Update the user record
  users[index] = {
    ...users[index],
    ...cleanUpdateData
  };
  
  console.log('Updated user data:', JSON.stringify({
    ...users[index],
    password: '***REDACTED***'
  }));
  
  console.log('==== USER MODEL UPDATE COMPLETE ====');

  return { ...users[index], password: undefined }; // Return user without password
};

// Get all users (for testing)
const getAll = () => {
  return users.map(user => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
};

module.exports = {
  findByEmail,
  findById,
  create,
  update,
  getAll
}; 