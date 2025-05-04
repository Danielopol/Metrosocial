export interface User {
  id: number;
  name: string;
  distance: string;
  avatar: string;
  content: string;
  contentDetail: string;
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