import React from 'react';
import ProximityLayers from './ProximityLayers';
import { ProximityUser, AuthUser } from '../../types';

// Mock data for demonstration
const mockCurrentUser: AuthUser = {
  id: 'current-user',
  username: 'jordan_smith',
  email: 'jordan@example.com',
  name: 'Jordan Smith',
  bio: 'Product Designer and tech enthusiast. Love connecting with people and exploring new places.',
  avatar: '👤',
  createdAt: new Date().toISOString()
};

const mockNearbyUsers: ProximityUser[] = [
  {
    id: 'user-d',
    username: 'user_d',
    avatar: 'D',
    distance: 5,
    zone: 'intimate',
    status: 'online',
    location: { lat: 40.7125, lng: -74.0058 },
    name: 'User D',
    bio: 'User D in the intimate zone for demonstration purposes.'
  },
  {
    id: 'user-1',
    username: 'alex_thompson',
    avatar: '👨‍💼',
    distance: 8,
    zone: 'intimate',
    status: 'online',
    location: { lat: 40.7128, lng: -74.0060 },
    name: 'Alex Thompson',
    bio: 'Coffee enthusiast and startup founder. Always up for discussing the latest tech trends.'
  },
  {
    id: 'user-2',
    username: 'sarah_chen',
    avatar: '👩‍🎨',
    distance: 25,
    zone: 'personal',
    status: 'online',
    location: { lat: 40.7135, lng: -74.0065 },
    name: 'Sarah Chen',
    bio: 'UX Designer passionate about creating beautiful digital experiences.'
  },
  {
    id: 'user-3',
    username: 'mike_rodriguez',
    avatar: '👨‍💻',
    distance: 45,
    zone: 'personal',
    status: 'busy',
    location: { lat: 40.7140, lng: -74.0070 },
    name: 'Mike Rodriguez',
    bio: 'Software engineer by day, musician by night. Working on an indie game.'
  },
  {
    id: 'user-4',
    username: 'emma_johnson',
    avatar: '👩‍✈️',
    distance: 120,
    zone: 'social',
    status: 'online',
    location: { lat: 40.7150, lng: -74.0080 },
    name: 'Emma Johnson',
    bio: 'Marketing professional who loves traveling and trying new cuisines.'
  },
  {
    id: 'user-5',
    username: 'josh_kim',
    avatar: '👨‍🔬',
    distance: 80,
    zone: 'social',
    status: 'away',
    location: { lat: 40.7145, lng: -74.0075 },
    name: 'Josh Kim',
    bio: 'Environmental scientist passionate about sustainability and clean energy.'
  },
  {
    id: 'user-6',
    username: 'lisa_wang',
    avatar: '🧘‍♀️',
    distance: 150,
    zone: 'social',
    status: 'online',
    location: { lat: 40.7155, lng: -74.0085 },
    name: 'Lisa Wang',
    bio: 'Product manager and yoga instructor. Balancing digital with mindful living.'
  },
  {
    id: 'user-7',
    username: 'carlos_silva',
    avatar: '👨‍🎓',
    distance: 250,
    zone: 'public',
    status: 'online',
    location: { lat: 40.7160, lng: -74.0090 },
    name: 'Carlos Silva',
    bio: 'Architecture student with passion for sustainable urban design.'
  },
  {
    id: 'user-8',
    username: 'nina_kowalski',
    avatar: '👩‍🍳',
    distance: 300,
    zone: 'public',
    status: 'busy',
    location: { lat: 40.7165, lng: -74.0095 },
    name: 'Nina Kowalski',
    bio: 'Professional chef and food blogger. Always hunting for perfect ingredients.'
  },
  {
    id: 'user-9',
    username: 'simple_emoji',
    avatar: '😀',
    distance: 50,
    zone: 'personal',
    status: 'online',
    location: { lat: 40.7170, lng: -74.0100 },
    name: 'Simple Emoji Test',
    bio: 'Testing simple emoji display.'
  },
  {
    id: 'user-10',
    username: 'complex_emoji',
    avatar: '👨‍👩‍👧‍👦',
    distance: 150,
    zone: 'social',
    status: 'online',
    location: { lat: 40.7175, lng: -74.0105 },
    name: 'Complex Emoji Test',
    bio: 'Testing complex family emoji with multiple ZWJ sequences.'
  }
];

const ProximityLayersDemo: React.FC = () => {
  const handleUserClick = (userId: string) => {
    console.log('Demo: User clicked:', userId);
  };

  const handleCreatePost = () => {
    console.log('Demo: Create post clicked');
  };

  return (
    <div className="w-full h-screen">
      <ProximityLayers
        nearbyUsers={mockNearbyUsers}
        currentUser={mockCurrentUser}
        onUserClick={handleUserClick}
        onCreatePost={handleCreatePost}
      />
    </div>
  );
};

export default ProximityLayersDemo; 