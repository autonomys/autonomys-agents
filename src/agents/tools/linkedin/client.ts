import axios from 'axios';

export type PostInfo = {
  id: string;
  text: string;
  shareUrl?: string;
  createdAt: Date;
  engagement?: {
    numLikes: number;
    numComments: number;
    numShares: number;
  };
};

export type ConnectionInfo = {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  industry?: string;
  profileUrl?: string;
};

export type ArticleInfo = {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  author: string;
  publishedDate: Date;
};

export type ReactionInfo = {
  actor: string;
  reactionType: 'LIKE' | 'EMPATHY' | 'APPRECIATION' | 'INTEREST' | 'MAYBE' | 'PRAISE';
  createdAt: Date;
};

interface LinkedInPost {
  id: string;
  text?: string;
  created?: number;
  shareUrl?: string;
  engagement?: {
    numLikes: number;
    numComments: number;
    numShares: number;
  };
}

interface LinkedInConnection {
  id: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  industry?: string;
  profileUrl?: string;
}

interface LinkedInReaction {
  actor: string;
  reactionType?: string;
  created?: number;
}

const LINKEDIN_API_URL = 'https://api.linkedin.com/v2';

const toPost = (post: LinkedInPost): PostInfo | undefined => {
  if (!post.id || !post.text) {
    return undefined;
  }
  return {
    id: post.id,
    text: post.text,
    shareUrl: post.shareUrl,
    createdAt: new Date((post.created || 0) * 1000),
    engagement: post.engagement
      ? {
          numLikes: post.engagement.numLikes || 0,
          numComments: post.engagement.numComments || 0,
          numShares: post.engagement.numShares || 0,
        }
      : undefined,
  };
};

const toConnection = (connection: LinkedInConnection): ConnectionInfo | undefined => {
  if (!connection.id || !connection.firstName || !connection.lastName) {
    return undefined;
  }
  return {
    id: connection.id,
    firstName: connection.firstName,
    lastName: connection.lastName,
    headline: connection.headline,
    industry: connection.industry,
    profileUrl: connection.profileUrl,
  };
};

const toReaction = (reaction: LinkedInReaction): ReactionInfo | undefined => {
  if (!reaction.actor || !reaction.reactionType) {
    return undefined;
  }
  return {
    actor: reaction.actor,
    reactionType: reaction.reactionType as ReactionInfo['reactionType'],
    createdAt: new Date((reaction.created || 0) * 1000),
  };
};

export const linkedInClient = async (accessToken: string) => {
  const api = axios.create({
    baseURL: LINKEDIN_API_URL,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
  });

  // Get the current user's profile
  const getCurrentUser = async () => {
    try {
      const response = await api.get('/me');
      return response.data.id;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  };

  const sharePost = async (text: string, articleUrl?: string) => {
    try {
      const userId = await getCurrentUser();
      const shareContent = {
        author: `urn:li:person:${userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: text,
            },
            shareMediaCategory: articleUrl ? 'ARTICLE' : 'NONE',
            media: articleUrl
              ? [
                  {
                    status: 'READY',
                    originalUrl: articleUrl,
                  },
                ]
              : undefined,
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await api.post('/ugcPosts', shareContent);
      return {
        success: true,
        postId: response.data.id,
        shareUrl: `https://www.linkedin.com/feed/update/${response.data.id}`,
      };
    } catch (error) {
      console.error('Error sharing post:', error);
      return {
        success: false,
        error: error,
      };
    }
  };

  const searchConnections = async (keywords: string, limit: number = 10) => {
    try {
      const response = await api.get('/search/people', {
        params: {
          q: keywords,
          count: limit,
          facetNetwork: ['F', 'S'],
        },
      });

      return response.data.elements.map(toConnection).filter(Boolean) as ConnectionInfo[];
    } catch (error) {
      console.error('Error searching connections:', error);
      return [];
    }
  };

  const sendConnectionRequest = async (profileId: string, message?: string) => {
    try {
      const response = await api.post('/invitation/connections', {
        invitee: `urn:li:person:${profileId}`,
        message: {
          'com.linkedin.invitations.InvitationMessage': {
            body: message || "I'd like to join your professional network on LinkedIn",
          },
        },
      });

      return {
        success: true,
        invitationId: response.data.id,
      };
    } catch (error) {
      console.error('Error sending connection request:', error);
      return {
        success: false,
        error: error,
      };
    }
  };

  const getRecentPosts = async (limit: number = 20) => {
    try {
      const userId = await getCurrentUser();
      const response = await api.get(`/ugcPosts`, {
        params: {
          q: 'authors',
          authors: [`urn:li:person:${userId}`],
          count: limit,
        },
      });

      return response.data.elements.map(toPost).filter(Boolean) as PostInfo[];
    } catch (error) {
      console.error('Error getting recent posts:', error);
      return [];
    }
  };

  const addReaction = async (postId: string, reactionType: ReactionInfo['reactionType']) => {
    try {
      const response = await api.post(`/reactions`, {
        object: `urn:li:share:${postId}`,
        type: `REACTION_${reactionType}`,
      });
      return {
        success: true,
        reactionId: response.data.id,
      };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return {
        success: false,
        error: error,
      };
    }
  };

  const getReactions = async (postId: string, limit: number = 50) => {
    try {
      const response = await api.get(`/socialActions/${postId}/reactions`, {
        params: {
          count: limit,
        },
      });
      return response.data.elements.map(toReaction).filter(Boolean) as ReactionInfo[];
    } catch (error) {
      console.error('Error getting reactions:', error);
      return [];
    }
  };

  return {
    sharePost,
    searchConnections,
    sendConnectionRequest,
    getRecentPosts,
    addReaction,
    getReactions,
  };
};

export default linkedInClient;
