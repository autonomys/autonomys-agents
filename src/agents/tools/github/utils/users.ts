import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClientWithOptions, GithubResponse } from './types.js';

export const getAuthenticatedUser = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']>
> => {
  const { githubClient } = client;
  const response = await githubClient.users.getAuthenticated();
  return {
    success: true,
    data: response.data,
  };
};

export const listAuthenticatedUserRepos = async (
  client: GithubClientWithOptions,
): Promise<
  GithubResponse<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']>
> => {
  const { githubClient } = client;
  const response = await githubClient.repos.listForAuthenticatedUser();
  return {
    success: true,
    data: response.data,
  };
};
