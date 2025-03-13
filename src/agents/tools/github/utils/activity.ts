import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import { GithubClientWithOptions, GithubResponse } from './types.js';

const logger = createLogger('github-issues');

export const getFeed = async (
  client: GithubClientWithOptions,
): Promise<GithubResponse<RestEndpointMethodTypes['activity']['getFeeds']['response']['data']>> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.activity.getFeeds();
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error getting GitHub feed:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const listNotifications = async (
  client: GithubClientWithOptions,
  all: boolean = false,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['activity']['listNotificationsForAuthenticatedUser']['response']['data']
  >
> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.activity.listNotificationsForAuthenticatedUser({ all });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub notifications:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const subscribeToRepo = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
  ignored: boolean = false,
): Promise<
  GithubResponse<RestEndpointMethodTypes['activity']['setRepoSubscription']['response']['data']>
> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.activity.setRepoSubscription({
      owner: targetOwner,
      repo: targetRepo,
      subscribed: true,
      ignored: ignored,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error subscribing to GitHub repo:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const unsubscribeFromRepo = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<
  GithubResponse<RestEndpointMethodTypes['activity']['deleteRepoSubscription']['response']['data']>
> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.activity.deleteRepoSubscription({
      owner: targetOwner,
      repo: targetRepo,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error unsubscribing from GitHub repo:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const listSubscriptions = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['activity']['listReposStarredByAuthenticatedUser']['response']['data']
  >
> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.activity.listReposStarredByAuthenticatedUser();
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub subscriptions:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const listMentions = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
> => {
  const { githubClient } = client;
  try {
    // Search for issues and PRs where the authenticated user is mentioned
    const response = await githubClient.search.issuesAndPullRequests({
      q: `mentions:${(await githubClient.users.getAuthenticated()).data.login}`,
      sort: 'updated',
      order: 'desc',
      per_page: 20,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub mentions:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};
