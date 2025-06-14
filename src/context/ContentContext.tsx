import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  SharedContent, 
  ContentType, 
  ContentSharingScope,
  ContentInteraction,
  ContentSettings,
  AuthUser
} from '../types';
import { useAuth } from './AuthContext';

// Mock data for content detection
const MOCK_CONTENT_SOURCES = [
  { 
    appId: 'browser',
    appName: 'Web Browser',
    appCategory: 'web',
    domain: 'bbc.com',
    url: 'https://www.bbc.com/news/technology-68651294'
  },
  { 
    appId: 'instagram',
    appName: 'Instagram',
    appCategory: 'social',
    domain: 'instagram.com'
  },
  { 
    appId: 'youtube',
    appName: 'YouTube',
    appCategory: 'video',
    domain: 'youtube.com',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  { 
    appId: 'spotify',
    appName: 'Spotify',
    appCategory: 'music',
    domain: 'spotify.com'
  },
  { 
    appId: 'medium',
    appName: 'Medium',
    appCategory: 'news',
    domain: 'medium.com'
  }
];

const MOCK_CONTENT_TYPES: Record<ContentType, { metadata: any, preview: any }> = {
  'web': {
    metadata: {
      title: 'NASA and SpaceX launch Crew-8 mission to International Space Station',
      description: 'Four astronauts begin six-month stay on the orbital outpost after successful Falcon 9 rocket launch.',
      author: 'BBC News',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://ichef.bbci.co.uk/news/976/cpsprodpb/118F7/production/_132712928_gettyimages-2051150615.jpg',
      category: 'Technology'
    },
    preview: {
      textPreview: 'NASA and SpaceX have successfully launched four astronauts to the International Space Station...',
      imagePreview: 'https://ichef.bbci.co.uk/news/976/cpsprodpb/118F7/production/_132712928_gettyimages-2051150615.jpg',
      hasMedia: true
    }
  },
  'social': {
    metadata: {
      title: 'Travel Photography',
      description: 'Amazing sunset views from my trip to Bali!',
      author: 'travel_photography',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1673469719025-95abacb03c9f',
      category: 'Travel'
    },
    preview: {
      textPreview: 'Amazing sunset views from my trip to Bali! #travel #photography #sunset #bali',
      imagePreview: 'https://images.unsplash.com/photo-1673469719025-95abacb03c9f',
      hasMedia: true
    }
  },
  'news': {
    metadata: {
      title: 'The Future of AI: Transforming Industries',
      description: 'How artificial intelligence is revolutionizing multiple sectors from healthcare to finance.',
      author: 'Tech Insights',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://images.unsplash.com/photo-1677442135096-de1a8b999973',
      category: 'Technology'
    },
    preview: {
      textPreview: 'Artificial intelligence is rapidly transforming industries across the world...',
      imagePreview: 'https://images.unsplash.com/photo-1677442135096-de1a8b999973',
      hasMedia: true
    }
  },
  'video': {
    metadata: {
      title: 'Never Gonna Give You Up',
      description: 'Rick Astley\'s official music video for "Never Gonna Give You Up"',
      author: 'Rick Astley',
      publishedAt: '2009-10-25T06:57:33Z',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      duration: 213,
      category: 'Music'
    },
    preview: {
      textPreview: 'Rick Astley\'s official music video for "Never Gonna Give You Up"',
      imagePreview: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      hasMedia: true
    }
  },
  'music': {
    metadata: {
      title: 'Billie Eilish - What Was I Made For?',
      description: 'From the Barbie Original Motion Picture Soundtrack',
      author: 'Billie Eilish',
      publishedAt: new Date().toISOString(),
      thumbnailUrl: 'https://i.scdn.co/image/ab67616d0000b273e29832f877355f3c6d21e989',
      duration: 221,
      category: 'Music'
    },
    preview: {
      textPreview: 'Now playing: Billie Eilish - What Was I Made For?',
      imagePreview: 'https://i.scdn.co/image/ab67616d0000b273e29832f877355f3c6d21e989',
      hasMedia: true
    }
  },
  'document': {
    metadata: {
      title: 'Annual Financial Report 2023',
      description: 'Fiscal year 2023 financial results and future outlook',
      author: 'Finance Department',
      publishedAt: new Date().toISOString(),
      category: 'Finance'
    },
    preview: {
      textPreview: 'Annual financial report detailing the company\'s performance during fiscal year 2023...',
      hasMedia: false
    }
  }
};

// Default user location (for demo purposes)
const DEFAULT_LOCATION = {
  coordinates: {
    latitude: 40.7128,
    longitude: -74.0060
  },
  accuracy: 10,
  locationName: 'New York City'
};

// Default content settings
const DEFAULT_CONTENT_SETTINGS: ContentSettings = {
  userId: '',
  sharingEnabled: true,
  defaultScope: 'public',
  autoDeletePeriod: 24 // 24 hours
};

interface ContentContextProps {
  sharedContents: SharedContent[];
  contentSettings: ContentSettings;
  interactions: ContentInteraction[];
  isContentDetectionEnabled: boolean;
  toggleContentDetection: () => void;
  detectContent: (contentType: ContentType, customContent?: any) => void;
  getContentById: (contentId: string) => SharedContent | undefined;
  likeContent: (contentId: string) => void;
  commentOnContent: (contentId: string, text: string) => void;
  shareContent: (contentId: string, destination: string) => void;
  deleteContent: (contentId: string) => void;
  updateContentSettings: (settings: Partial<ContentSettings>) => void;
  getNearbyContent: () => SharedContent[];
}

const ContentContext = createContext<ContentContextProps | undefined>(undefined);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { authState } = useAuth();
  const [sharedContents, setSharedContents] = useState<SharedContent[]>([]);
  const [interactions, setInteractions] = useState<ContentInteraction[]>([]);
  const [contentSettings, setContentSettings] = useState<ContentSettings>(DEFAULT_CONTENT_SETTINGS);
  const [isContentDetectionEnabled, setIsContentDetectionEnabled] = useState(false);

  // Load data from localStorage on initial load
  useEffect(() => {
    if (authState.user) {
      const storedContents = localStorage.getItem('metrosocial_contents');
      const storedInteractions = localStorage.getItem('metrosocial_interactions');
      const storedSettings = localStorage.getItem(`metrosocial_settings_${authState.user.id}`);

      if (storedContents) {
        setSharedContents(JSON.parse(storedContents));
      }

      if (storedInteractions) {
        setInteractions(JSON.parse(storedInteractions));
      }

      if (storedSettings) {
        setContentSettings({
          ...DEFAULT_CONTENT_SETTINGS,
          ...JSON.parse(storedSettings),
          userId: authState.user.id
        });
      } else {
        setContentSettings({
          ...DEFAULT_CONTENT_SETTINGS,
          userId: authState.user.id
        });
      }
    }
  }, [authState.user]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (sharedContents.length > 0) {
      localStorage.setItem('metrosocial_contents', JSON.stringify(sharedContents));
    }
  }, [sharedContents]);

  useEffect(() => {
    if (interactions.length > 0) {
      localStorage.setItem('metrosocial_interactions', JSON.stringify(interactions));
    }
  }, [interactions]);

  useEffect(() => {
    if (authState.user && contentSettings.userId) {
      localStorage.setItem(`metrosocial_settings_${authState.user.id}`, JSON.stringify(contentSettings));
    }
  }, [contentSettings, authState.user]);

  // Clean up expired content
  useEffect(() => {
    const now = new Date().toISOString();
    const validContents = sharedContents.filter(content => content.expiresAt > now);
    
    if (validContents.length !== sharedContents.length) {
      setSharedContents(validContents);
    }
  }, [sharedContents]);

  // Toggle content detection
  const toggleContentDetection = () => {
    setIsContentDetectionEnabled(prev => !prev);
    setContentSettings(prev => ({
      ...prev,
      sharingEnabled: !isContentDetectionEnabled
    }));
  };

  // Generate a simulated content detection
  const detectContent = (contentType: ContentType, customContent?: any) => {
    if (!isContentDetectionEnabled || !authState.user) return;

    let source;
    let mockContent;

    if (customContent) {
      // Use custom content provided by the user
      source = {
        appId: contentType,
        appName: customContent.sourceName || 'Custom App',
        appCategory: contentType,
        domain: customContent.url ? new URL(customContent.url).hostname : '',
        url: customContent.url || ''
      };

      const hasScreenshot = !!customContent.screenshotData;

      mockContent = {
        metadata: {
          title: customContent.title,
          description: customContent.description,
          author: authState.user.username,
          publishedAt: new Date().toISOString(),
          thumbnailUrl: customContent.screenshotData || '',
          category: contentType
        },
        preview: {
          textPreview: customContent.description,
          imagePreview: customContent.screenshotData || '',
          hasMedia: hasScreenshot
        }
      };
    } else {
      // Use mock data as before
      const randomSourceIndex = Math.floor(Math.random() * MOCK_CONTENT_SOURCES.length);
      source = MOCK_CONTENT_SOURCES.find(s => s.appCategory === contentType) || 
               MOCK_CONTENT_SOURCES[randomSourceIndex];
      
      mockContent = MOCK_CONTENT_TYPES[contentType];
    }

    const now = new Date();
    const expirationDate = new Date(now);
    expirationDate.setHours(expirationDate.getHours() + contentSettings.autoDeletePeriod);

    const newContent: SharedContent = {
      contentId: uuidv4(),
      userId: authState.user.id,
      username: authState.user.username,
      userAvatar: authState.user.avatar,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: expirationDate.toISOString(),
      contentType,
      source,
      metadata: mockContent.metadata,
      preview: mockContent.preview,
      sharing: {
        scope: contentSettings.defaultScope,
        allowComments: true,
        allowSharing: true
      },
      statistics: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      location: DEFAULT_LOCATION
    };

    setSharedContents(prev => [newContent, ...prev]);
  };

  // Get content by ID
  const getContentById = (contentId: string) => {
    return sharedContents.find(content => content.contentId === contentId);
  };

  // Like a content
  const likeContent = (contentId: string) => {
    if (!authState.user) return;

    // Check if user already liked this content
    const existingLike = interactions.find(
      interaction => 
        interaction.contentId === contentId && 
        interaction.userId === authState.user?.id &&
        interaction.type === 'like'
    );

    if (existingLike) {
      // Unlike: remove the interaction
      setInteractions(prev => 
        prev.filter(interaction => interaction.interactionId !== existingLike.interactionId)
      );

      // Update statistics
      setSharedContents(prev => 
        prev.map(content => {
          if (content.contentId === contentId) {
            return {
              ...content,
              statistics: {
                ...content.statistics,
                likes: content.statistics.likes - 1
              }
            };
          }
          return content;
        })
      );
    } else {
      // Like: add a new interaction
      const newInteraction: ContentInteraction = {
        interactionId: uuidv4(),
        contentId,
        userId: authState.user.id,
        type: 'like',
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      setInteractions(prev => [...prev, newInteraction]);

      // Update statistics
      setSharedContents(prev => 
        prev.map(content => {
          if (content.contentId === contentId) {
            return {
              ...content,
              statistics: {
                ...content.statistics,
                likes: content.statistics.likes + 1
              }
            };
          }
          return content;
        })
      );
    }
  };

  // Comment on content
  const commentOnContent = (contentId: string, text: string) => {
    if (!authState.user || !text.trim()) return;

    const newComment: ContentInteraction = {
      interactionId: uuidv4(),
      contentId,
      userId: authState.user.id,
      type: 'comment',
      createdAt: new Date().toISOString(),
      data: {
        comment: text.trim()
      },
      status: 'active'
    };

    setInteractions(prev => [...prev, newComment]);

    // Update statistics
    setSharedContents(prev => 
      prev.map(content => {
        if (content.contentId === contentId) {
          return {
            ...content,
            statistics: {
              ...content.statistics,
              comments: content.statistics.comments + 1
            }
          };
        }
        return content;
      })
    );
  };

  // Share content
  const shareContent = (contentId: string, destination: string) => {
    if (!authState.user) return;

    const newShare: ContentInteraction = {
      interactionId: uuidv4(),
      contentId,
      userId: authState.user.id,
      type: 'share',
      createdAt: new Date().toISOString(),
      data: {
        shareDestination: destination
      },
      status: 'active'
    };

    setInteractions(prev => [...prev, newShare]);

    // Update statistics
    setSharedContents(prev => 
      prev.map(content => {
        if (content.contentId === contentId) {
          return {
            ...content,
            statistics: {
              ...content.statistics,
              shares: content.statistics.shares + 1
            }
          };
        }
        return content;
      })
    );
  };

  // Delete/stop sharing content
  const deleteContent = (contentId: string) => {
    if (!authState.user) return;
    
    // Remove the content
    setSharedContents(prev => 
      prev.filter(content => content.contentId !== contentId)
    );
    
    // Also remove any interactions associated with this content
    setInteractions(prev => 
      prev.filter(interaction => interaction.contentId !== contentId)
    );
  };

  // Update content settings
  const updateContentSettings = (settings: Partial<ContentSettings>) => {
    setContentSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  // Get nearby content (simulated)
  const getNearbyContent = () => {
    // For demo, return all contents from other users
    return sharedContents.filter(content => 
      content.userId !== authState.user?.id && 
      content.sharing.scope === 'public'
    );
  };

  return (
    <ContentContext.Provider 
      value={{
        sharedContents,
        contentSettings,
        interactions,
        isContentDetectionEnabled,
        toggleContentDetection,
        detectContent,
        getContentById,
        likeContent,
        commentOnContent,
        shareContent,
        deleteContent,
        updateContentSettings,
        getNearbyContent
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

// Custom hook to use the content context
export const useContent = () => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}; 