import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { GithubResponse } from './utils/types.js';

const logger = createLogger('github-users-tools');

/**
 * Creates a tool to get the authenticated GitHub user's information
 */
export const createGetAuthenticatedUserTool = (
  getAuthenticatedUser: () => Promise<
    GithubResponse<RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'get_github_authenticated_user',
    description: `Get information about the authenticated GitHub user (yourself).
    USE THIS WHEN:
    - You need to know your GitHub username
    - You need to check if a comment was made by you
    - You need to identify yourself in GitHub interactions
    
    IMPORTANT: Use this tool to get your username before checking comments or issues,
    so you can identify which comments were made by you and avoid duplicate comments.`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Getting authenticated GitHub user');
        const { success, data } = await getAuthenticatedUser();
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error getting authenticated GitHub user:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

export const createListAuthenticatedUserReposTool = (
  listAuthenticatedUserRepos: () => Promise<
    GithubResponse<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_authenticated_user_repos',
    description: 'Lists repositories owned by the authenticated user',
    schema: z.object({}),
    func: async () => {
      try {
        const { success, data } = await listAuthenticatedUserRepos();
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing authenticated user repositories:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });
