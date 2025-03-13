import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClientWithOptions, GithubResponse } from './types.js';

export const listUserRepos = async (
  client: GithubClientWithOptions,
  username: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForUser']['response']['data']>> => {
  const { githubClient } = client;
  const response = await githubClient.repos.listForUser({ username });
  return {
    success: true,
    data: response.data,
  };
};

export const listOrgRepos = async (
  client: GithubClientWithOptions,
  org: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForOrg']['response']['data']>> => {
  const { githubClient } = client;
  const response = await githubClient.repos.listForOrg({ org });
  return {
    success: true,
    data: response.data,
  };
};

export const listForks = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForks']['response']['data']>> => {
  const { githubClient } = client;
  const response = await githubClient.repos.listForks({
    owner: targetOwner,
    repo: targetRepo,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const createFork = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['createFork']['response']['data']>> => {
  const { githubClient } = client;
  const response = await githubClient.repos.createFork({
    owner: targetOwner,
    repo: targetRepo,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const getDefaultBranch = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['get']['response']['data']>> => {
  const { githubClient } = client;
  const response = await githubClient.repos.get({
    owner: targetOwner,
    repo: targetRepo,
  });

  return {
    success: true,
    data: response.data,
  };
};
