import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { ConnectionInfo, linkedInClient, PostInfo, ReactionInfo } from './client.js';

const logger = createLogger('linkedin-tools');

/**
 * Creates a tool to share a post on LinkedIn
 */
export const createSharePostTool = (
  sharePost: (
    text: string,
    articleUrl?: string,
  ) => Promise<{ success: boolean; postId?: string; shareUrl?: string; error?: any }>,
) =>
  new DynamicStructuredTool({
    name: 'share_linkedin_post',
    description: `Share a post on LinkedIn, optionally with an article link.
    USE THIS WHEN:
    - You want to share technical articles about AI agent development
    - You want to post about the future of decentralized AI
    - You want to highlight Autonomys's technical innovations
    FORMAT: Keep posts professional, engaging, and focused on technical/business aspects.`,
    schema: z.object({
      text: z.string().describe('The text content of the post'),
      articleUrl: z.string().optional().describe('Optional URL to an article to share'),
    }),
    func: async ({ text, articleUrl }) => {
      try {
        logger.info('Sharing LinkedIn post:', { text, articleUrl });
        const result = await sharePost(text, articleUrl);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error sharing LinkedIn post:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to search for potential connections on LinkedIn
 */
export const createSearchConnectionsTool = (
  searchConnections: (keywords: string, limit: number) => Promise<ConnectionInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'search_linkedin_connections',
    description: `Search for potential connections on LinkedIn based on keywords.
    USE THIS WHEN:
    - You want to find enterprise decision-makers
    - You want to expand the network in AI/tech industry
    - You're looking for specific roles or companies
    FORMAT: Use relevant keywords like job titles, company names, or industry terms.`,
    schema: z.object({
      keywords: z.string().describe('Keywords to search for connections'),
      limit: z.number().describe('Maximum number of connections to return'),
    }),
    func: async ({ keywords, limit }) => {
      try {
        logger.info('Searching LinkedIn connections:', { keywords, limit });
        const connections = await searchConnections(keywords, limit);
        return JSON.stringify({ success: true, connections });
      } catch (error) {
        logger.error('Error searching LinkedIn connections:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to send connection requests on LinkedIn
 */
export const createSendConnectionRequestTool = (
  sendConnectionRequest: (
    profileId: string,
    message?: string,
  ) => Promise<{ success: boolean; invitationId?: string; error?: any }>,
) =>
  new DynamicStructuredTool({
    name: 'send_linkedin_connection_request',
    description: `Send a connection request to a LinkedIn user.
    USE THIS WHEN:
    - You want to connect with enterprise decision-makers
    - You've identified relevant professionals in the AI/tech industry
    FORMAT: Include a personalized message explaining the connection request.`,
    schema: z.object({
      profileId: z.string().describe('The LinkedIn profile ID to connect with'),
      message: z
        .string()
        .optional()
        .describe('Optional personalized message for the connection request'),
    }),
    func: async ({ profileId, message }) => {
      try {
        logger.info('Sending LinkedIn connection request:', { profileId, message });
        const result = await sendConnectionRequest(profileId, message);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error sending LinkedIn connection request:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to get recent LinkedIn posts
 */
export const createGetRecentPostsTool = (getRecentPosts: (limit: number) => Promise<PostInfo[]>) =>
  new DynamicStructuredTool({
    name: 'get_recent_linkedin_posts',
    description: `Get recent posts from LinkedIn feed.
    USE THIS WHEN:
    - You want to monitor engagement on recent posts
    - You need to track the performance of shared content
    FORMAT: Specify the number of recent posts to retrieve.`,
    schema: z.object({
      limit: z.number().describe('Maximum number of posts to return'),
    }),
    func: async ({ limit }) => {
      try {
        logger.info('Getting recent LinkedIn posts:', { limit });
        const posts = await getRecentPosts(limit);
        return JSON.stringify({ success: true, posts });
      } catch (error) {
        logger.error('Error getting recent LinkedIn posts:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to add a reaction to a LinkedIn post
 */
export const createAddReactionTool = (
  addReaction: (
    postId: string,
    reactionType: ReactionInfo['reactionType'],
  ) => Promise<{ success: boolean; reactionId?: string; error?: any }>,
) =>
  new DynamicStructuredTool({
    name: 'add_linkedin_reaction',
    description: `Add a reaction to a LinkedIn post.
    USE THIS WHEN:
    - You want to engage with relevant content
    - You want to show appreciation for technical articles
    - You want to support posts about AI development
    FORMAT: Choose an appropriate reaction type (LIKE, EMPATHY, APPRECIATION, INTEREST, MAYBE, PRAISE).`,
    schema: z.object({
      postId: z.string().describe('The ID of the post to react to'),
      reactionType: z
        .enum(['LIKE', 'EMPATHY', 'APPRECIATION', 'INTEREST', 'MAYBE', 'PRAISE'])
        .describe('The type of reaction'),
    }),
    func: async ({ postId, reactionType }) => {
      try {
        logger.info('Adding LinkedIn reaction:', { postId, reactionType });
        const result = await addReaction(postId, reactionType);
        return JSON.stringify(result);
      } catch (error) {
        logger.error('Error adding LinkedIn reaction:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to get reactions on a LinkedIn post
 */
export const createGetReactionsTool = (
  getReactions: (postId: string, limit: number) => Promise<ReactionInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'get_linkedin_reactions',
    description: `Get reactions on a LinkedIn post.
    USE THIS WHEN:
    - You want to analyze engagement on posts
    - You want to measure content performance
    - You want to see how people respond to technical content
    FORMAT: Specify the post ID and optionally limit the number of reactions to retrieve.`,
    schema: z.object({
      postId: z.string().describe('The ID of the post to get reactions for'),
      limit: z.number().optional().describe('Maximum number of reactions to return'),
    }),
    func: async ({ postId, limit = 50 }) => {
      try {
        logger.info('Getting LinkedIn reactions:', { postId, limit });
        const reactions = await getReactions(postId, limit);
        return JSON.stringify({ success: true, reactions });
      } catch (error) {
        logger.error('Error getting LinkedIn reactions:', error);
        throw error;
      }
    },
  });

export const createLinkedInTools = async (linkedInToken: string) => {
  const linkedin = await linkedInClient(linkedInToken);

  return [
    createSharePostTool(linkedin.sharePost),
    createSearchConnectionsTool(linkedin.searchConnections),
    createSendConnectionRequestTool(linkedin.sendConnectionRequest),
    createGetRecentPostsTool(linkedin.getRecentPosts),
    createAddReactionTool(linkedin.addReaction),
    createGetReactionsTool(linkedin.getReactions),
  ];
};
