import { supabase } from '../config/supabase';
import { AuthUser, SocialPost, SocialComment } from '../types';

// Auth Service
export class AuthService {
  static async signUp(email: string, password: string, username: string, name?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          name: name || username
        }
      }
    });

    if (error) throw error;
    return data;
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    // Get user profile from our users table
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) return null;

    return {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      name: profile.name,
      bio: profile.bio,
      avatar: profile.avatar,
      createdAt: profile.created_at
    };
  }

  static async updateProfile(userId: string, updates: Partial<AuthUser>) {
    const { data, error } = await supabase
      .from('users')
      .update({
        username: updates.username,
        name: updates.name,
        bio: updates.bio,
        avatar: updates.avatar,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });
  }
}

// Posts Service
export class PostsService {
  static async createPost(post: {
    text?: string;
    url?: string;
    image?: string;
  }): Promise<SocialPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        text: post.text || null,
        url: post.url || null,
        image: post.image || null
      })
      .select(`
        *,
        users:user_id (
          username,
          name,
          avatar
        )
      `)
      .single();

    if (error) throw error;

    // Transform to match our SocialPost interface
    return {
      id: data.id,
      userId: data.user_id,
      username: data.users.username,
      userAvatar: data.users.avatar,
      text: data.text,
      url: data.url,
      image: data.image,
      createdAt: data.created_at,
      comments: []
    };
  }

  static async getPosts(): Promise<SocialPost[]> {
    const { data, error } = await supabase
      .from('posts_with_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get comments for all posts
    const { data: commentsData } = await supabase
      .from('comments_with_details')
      .select('*');

    // Transform to match our SocialPost interface
    return data.map(post => ({
      id: post.id,
      userId: post.user_id,
      username: post.username,
      userAvatar: post.user_avatar,
      text: post.text,
      url: post.url,
      image: post.image,
      createdAt: post.created_at,
      comments: commentsData?.filter(comment => comment.post_id === post.id).map(comment => ({
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        username: comment.username,
        userAvatar: comment.user_avatar,
        text: comment.text,
        createdAt: comment.created_at
      })) || []
    }));
  }

  static async getUserLatestPost(userId: string): Promise<SocialPost | null> {
    const { data, error } = await supabase
      .from('posts_with_details')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    // Get comments for this post
    const { data: commentsData } = await supabase
      .from('comments_with_details')
      .select('*')
      .eq('post_id', data.id);

    return {
      id: data.id,
      userId: data.user_id,
      username: data.username,
      userAvatar: data.user_avatar,
      text: data.text,
      url: data.url,
      image: data.image,
      createdAt: data.created_at,
      comments: commentsData?.map(comment => ({
        id: comment.id,
        postId: comment.post_id,
        userId: comment.user_id,
        username: comment.username,
        userAvatar: comment.user_avatar,
        text: comment.text,
        createdAt: comment.created_at
      })) || []
    };
  }

  static async addComment(postId: string, text: string): Promise<SocialComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        text
      })
      .select(`
        *,
        users:user_id (
          username,
          name,
          avatar
        )
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      username: data.users.username,
      userAvatar: data.users.avatar,
      text: data.text,
      createdAt: data.created_at
    };
  }

  static async likePost(postId: string) {
    // Note: You might want to implement a likes table
    // For now, this is a placeholder
    console.log('Like functionality to be implemented with likes table');
  }

  // Real-time subscriptions
  static subscribeToNewPosts(callback: (post: SocialPost) => void) {
    return supabase
      .channel('posts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, async (payload) => {
        // Fetch the complete post with user details
        const { data } = await supabase
          .from('posts_with_details')
          .select('*')
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const post: SocialPost = {
            id: data.id,
            userId: data.user_id,
            username: data.username,
            userAvatar: data.user_avatar,
            text: data.text,
            url: data.url,
            image: data.image,
            createdAt: data.created_at,
            comments: []
          };
          callback(post);
        }
      })
      .subscribe();
  }

  static subscribeToNewComments(callback: (comment: SocialComment) => void) {
    return supabase
      .channel('comments')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, async (payload) => {
        // Fetch the complete comment with user details
        const { data } = await supabase
          .from('comments_with_details')
          .select('*')
          .eq('id', payload.new.id)
          .single();

        if (data) {
          const comment: SocialComment = {
            id: data.id,
            postId: data.post_id,
            userId: data.user_id,
            username: data.username,
            userAvatar: data.user_avatar,
            text: data.text,
            createdAt: data.created_at
          };
          callback(comment);
        }
      })
      .subscribe();
  }
}

// Location Service
export class LocationService {
  static async updateUserLocation(latitude: number, longitude: number, isOnline: boolean = true) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_locations')
      .upsert({
        user_id: user.id,
        latitude,
        longitude,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async setOnlineStatus(isOnline: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_locations')
      .update({
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) throw error;
  }

  static async getNearbyUsers(latitude: number, longitude: number, radiusMeters: number = 5000) {
    const { data, error } = await supabase
      .rpc('nearby_users', {
        lat: latitude,
        lng: longitude,
        radius_meters: radiusMeters
      });

    if (error) throw error;

    return data.map((user: any) => ({
      id: user.id,
      userId: user.id, // For compatibility
      username: user.username,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      distance: user.distance,
      location: {
        latitude: user.latitude,
        longitude: user.longitude
      },
      isOnline: user.is_online,
      lastSeen: user.last_seen
    }));
  }

  // Real-time subscriptions for location updates
  static subscribeToLocationUpdates(callback: (update: any) => void) {
    return supabase
      .channel('user_locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, callback)
      .subscribe();
  }
}

// Export all services
export const supabaseServices = {
  auth: AuthService,
  posts: PostsService,
  location: LocationService
}; 