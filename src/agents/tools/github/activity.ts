import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { GithubResponse } from './utils/types.js';

const logger = createLogger('github-activity-tools');

/**
 * Creates a tool to get GitHub feed
 */
export const createGetFeedTool = (
  getFeed: () => Promise<
    GithubResponse<RestEndpointMethodTypes['activity']['getFeeds']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'get_github_feed',
    description: `Get GitHub feed for the authenticated user.
    USE THIS WHEN:
    - You want to check highlights from your GitHub feed`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Getting GitHub feed');
        const feed = await getFeed();
        return {
          success: true,
          feed,
        };
      } catch (error) {
        logger.error('Error getting GitHub feed:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list GitHub notifications
 */
export const createListNotificationsTool = (
  listNotifications: (
    all?: boolean,
  ) => Promise<
    GithubResponse<
      RestEndpointMethodTypes['activity']['listNotificationsForAuthenticatedUser']['response']['data']
    >
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_notifications',
    description: `List GitHub notifications for the authenticated user.
    USE THIS WHEN:
    - You want to check your unread notifications
    - You need to stay updated on repository activities
    - You want to see all notifications, including read ones`,
    schema: z.object({
      all: z
        .boolean()
        .optional()
        .describe('If true, show all notifications. If false, show only unread notifications.'),
    }),
    func: async ({ all = false }) => {
      try {
        logger.info('Listing GitHub notifications:', { all });
        const notifications = await listNotifications(all);
        return {
          success: true,
          notifications,
        };
      } catch (error) {
        logger.error('Error listing GitHub notifications:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to watch a GitHub repository
 */
export const createWatchRepoTool = (
  subscribeToRepo: (
    owner: string,
    repo: string,
    ignored?: boolean,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['activity']['setRepoSubscription']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'watch_github_repository',
    description: `Watch a GitHub repository to receive notifications about its activity.
    USE THIS WHEN:
    - You want to start monitoring a repository
    - You need to track changes and updates in a repository
    - You want to receive notifications about issues, PRs, and other activities
    
    Note: You can optionally set 'ignored' to true to watch without receiving notifications.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository to watch'),
      repo: z.string().describe('The name of the repository to watch'),
      ignored: z
        .boolean()
        .optional()
        .describe(
          'If true, watch the repository but do not receive notifications. Default is false.',
        ),
    }),
    func: async ({ owner, repo, ignored = false }) => {
      try {
        logger.info('Watching GitHub repository:', { owner, repo, ignored });
        await subscribeToRepo(owner, repo, ignored);
        return {
          success: true,
          message: `Successfully watched repository ${owner}/${repo}`,
        };
      } catch (error) {
        logger.error('Error watching GitHub repository:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to unwatch a GitHub repository
 */
export const createUnwatchRepoTool = (
  unsubscribeFromRepo: (
    owner: string,
    repo: string,
  ) => Promise<
    GithubResponse<
      RestEndpointMethodTypes['activity']['deleteRepoSubscription']['response']['data']
    >
  >,
) =>
  new DynamicStructuredTool({
    name: 'unwatch_github_repository',
    description: `Stop watching a GitHub repository.
    USE THIS WHEN:
    - You want to stop monitoring a repository
    - You no longer need notifications from a repository
    - You want to clean up your watched repositories list`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository to unwatch'),
      repo: z.string().describe('The name of the repository to unwatch'),
    }),
    func: async ({ owner, repo }) => {
      try {
        logger.info('Un-watching GitHub repository:', { owner, repo });
        await unsubscribeFromRepo(owner, repo);
        return {
          success: true,
          message: `Successfully unwatched repository ${owner}/${repo}`,
        };
      } catch (error) {
        logger.error('Error un-watching GitHub repository:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list watched GitHub repositories
 */
export const createListWatchedReposTool = (
  listSubscriptions: () => Promise<
    GithubResponse<
      RestEndpointMethodTypes['activity']['listReposStarredByAuthenticatedUser']['response']['data']
    >
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_watched_github_repositories',
    description: `List all GitHub repositories you are watching.
    USE THIS WHEN:
    - You want to see all repositories you're watching
    - You need to check your notification settings for repositories
    - You want to review which repositories you're monitoring`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Listing watched GitHub repositories');
        const repos = await listSubscriptions();
        return {
          success: true,
          watched_repositories: repos,
        };
      } catch (error) {
        logger.error('Error listing watched GitHub repositories:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list GitHub mentions
 */
export const createListMentionsTool = (
  listMentions: () => Promise<
    GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_mentions',
    description: `List GitHub issues and pull requests where you are mentioned.
    USE THIS WHEN:
    - You want to check where you've been mentioned
    - You need to find discussions you're involved in
    - You want to track conversations where someone has tagged you`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Listing GitHub mentions');
        const mentions = await listMentions();
        return {
          success: true,
          mentions,
        };
      } catch (error) {
        logger.error('Error listing GitHub mentions:', error);
        throw error;
      }
    },
  });
