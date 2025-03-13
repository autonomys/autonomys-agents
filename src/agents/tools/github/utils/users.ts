import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import { GithubClientWithOptions, GithubResponse } from './types.js';

const logger = createLogger('github-users');

export const getAuthenticatedUser = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']>
> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.users.getAuthenticated();
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error getting GitHub authenticated user:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const listAuthenticatedUserRepos = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']>
> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.repos.listForAuthenticatedUser();

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub authenticated user repositories:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};
