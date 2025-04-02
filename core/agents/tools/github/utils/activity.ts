import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClient, GithubResponse } from './types.js';

export const getFeed = async (
  client: GithubClient,
): Promise<GithubResponse<RestEndpointMethodTypes['activity']['getFeeds']['response']['data']>> => {
  const response = await client.activity.getFeeds();
  return {
    success: true,
    data: response.data,
  };
};

export const listNotifications = async (
  client: GithubClient,
  all: boolean = false,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['activity']['listNotificationsForAuthenticatedUser']['response']['data']
  >
> => {
  const response = await client.activity.listNotificationsForAuthenticatedUser({ all });
  return {
    success: true,
    data: response.data,
  };
};

export const subscribeToRepo = async (
  client: GithubClient,
  owner: string,
  repo: string,
  ignored: boolean = false,
): Promise<
  GithubResponse<RestEndpointMethodTypes['activity']['setRepoSubscription']['response']['data']>
> => {
  const response = await client.activity.setRepoSubscription({
    owner,
    repo,
    subscribed: true,
    ignored,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const unsubscribeFromRepo = async (
  client: GithubClient,
  owner: string,
  repo: string,
): Promise<
  GithubResponse<RestEndpointMethodTypes['activity']['deleteRepoSubscription']['response']['data']>
> => {
  const response = await client.activity.deleteRepoSubscription({
    owner,
    repo,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const listSubscriptions = async (
  client: GithubClient,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['activity']['listReposStarredByAuthenticatedUser']['response']['data']
  >
> => {
  const response = await client.activity.listReposStarredByAuthenticatedUser();
  return {
    success: true,
    data: response.data,
  };
};

export const listMentions = async (
  client: GithubClient,
): Promise<
  GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
> => {
  // Search for issues and PRs where the authenticated user is mentioned
  const response = await client.search.issuesAndPullRequests({
    q: `mentions:${(await client.users.getAuthenticated()).data.login}`,
    sort: 'updated',
    order: 'desc',
    per_page: 20,
  });
  return {
    success: true,
    data: response.data,
  };
};
