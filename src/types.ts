export interface User {
  id: number;
  name: string;
  distance: string;
  avatar: string;
  content: string;
  contentDetail: string;
  location?: Location;
}

export interface Comment {
  id: number;
  user: {
    name: string;
    avatar: string;
  };
  text: string;
  timestamp: string;
}

// Authentication types
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  location?: Location;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  name?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Content Sharing Types
export type ContentType = 'web' | 'social' | 'news' | 'video' | 'music' | 'document';
export type ContentSharingScope = 'public' | 'friends' | 'selected';

export interface ContentSource {
  appId: string;
  appName: string;
  appCategory: string;
  url?: string;
  domain?: string;
}

export interface ContentMetadata {
  title: string;
  description: string;
  author?: string;
  publishedAt?: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  keywords?: string[];
  category: string;
}

export interface ContentPreview {
  textPreview?: string;
  imagePreview?: string;
  colorPalette?: string[];
  hasMedia: boolean;
}

export interface ContentSharingOptions {
  scope: ContentSharingScope;
  allowComments: boolean;
  allowSharing: boolean;
}

export interface ContentStatistics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface ContentLocation {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  accuracy: number; // in meters
  locationName?: string;
}

export interface SharedContent {
  contentId: string;
  userId: string;
  username?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  contentType: ContentType;
  source: ContentSource;
  metadata: ContentMetadata;
  preview: ContentPreview;
  sharing: ContentSharingOptions;
  statistics: ContentStatistics;
  location: ContentLocation;
}

export interface ContentInteraction {
  interactionId: string;
  contentId: string;
  userId: string;
  type: 'like' | 'comment' | 'share';
  createdAt: string;
  data?: {
    comment?: string;
    reactionType?: string;
    shareDestination?: string;
  };
  parentId?: string; // for comment replies
  status: 'active' | 'deleted' | 'flagged';
}

export interface ContentSettings {
  userId: string;
  sharingEnabled: boolean;
  defaultScope: ContentSharingScope;
  autoDeletePeriod: number; // in hours
}

export interface SocialPost {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  url?: string;
  image?: string;
  createdAt: string;
  comments: SocialComment[];
  parentPostId?: string; // For replies, this is the original post ID
  replyingToUser?: string; // Username of the person being replied to
  likes?: string[]; // Array of user IDs who liked this post
  likeCount?: number; // Total number of likes
}

export interface SocialComment {
  id: string;
  postId: string;
  parentPostId?: string; // For replies, this is the original post ID
  userId: string;
  username: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
  replies?: SocialComment[]; // Keep for backward compatibility
}

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationName?: string;
}

// Proximity Layers Interfaces
export interface ProximityUser {
  id: string;
  username: string;
  avatar: string;
  distance: number;
  zone: 'intimate' | 'personal' | 'social' | 'public';
  status: 'online' | 'away' | 'busy';
  location: {
    lat: number;
    lng: number;
  };
  name?: string;
  bio?: string;
}

export interface ProximityLayersProps {
  nearbyUsers: ProximityUser[];
  currentUser: AuthUser;
  onUserClick: (userId: string) => void;
  onCreatePost: () => void;
} 