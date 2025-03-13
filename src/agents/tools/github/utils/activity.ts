import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClientWithOptions, GithubResponse } from './types.js';

export const getFeed = async (
  client: GithubClientWithOptions,
): Promise<GithubResponse<RestEndpointMethodTypes['activity']['getFeeds']['response']['data']>> => {
  const { githubClient } = client;
  const response = await githubClient.activity.getFeeds();
  return {
    success: true,
    data: response.data,
  };
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
  const response = await githubClient.activity.listNotificationsForAuthenticatedUser({ all });
  return {
    success: true,
    data: response.data,
  };
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
};

export const unsubscribeFromRepo = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<
  GithubResponse<RestEndpointMethodTypes['activity']['deleteRepoSubscription']['response']['data']>
> => {
  const { githubClient } = client;
  const response = await githubClient.activity.deleteRepoSubscription({
    owner: targetOwner,
    repo: targetRepo,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const listSubscriptions = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['activity']['listReposStarredByAuthenticatedUser']['response']['data']
  >
> => {
  const { githubClient } = client;
  const response = await githubClient.activity.listReposStarredByAuthenticatedUser();
  return {
    success: true,
    data: response.data,
  };
};

export const listMentions = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
> => {
  const { githubClient } = client;
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
};
