import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClient, GithubResponse } from './types.js';

export const getAuthenticatedUser = async (
  client: GithubClient,
): Promise<
  GithubResponse<RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']>
> => {
  const response = await client.users.getAuthenticated();
  return {
    success: true,
    data: response.data,
  };
};

export const listAuthenticatedUserRepos = async (
  client: GithubClient,
): Promise<
  GithubResponse<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']>
> => {
  const response = await client.repos.listForAuthenticatedUser();
  return {
    success: true,
    data: response.data,
  };
};
