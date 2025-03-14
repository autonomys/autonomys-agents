import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClient, GithubResponse } from './types.js';

export const listUserRepos = async (
  client: GithubClient,
  username: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForUser']['response']['data']>> => {
  const response = await client.repos.listForUser({ username });
  return {
    success: true,
    data: response.data,
  };
};

export const listOrgRepos = async (
  client: GithubClient,
  org: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForOrg']['response']['data']>> => {
  const response = await client.repos.listForOrg({ org });
  return {
    success: true,
    data: response.data,
  };
};

export const listForks = async (
  client: GithubClient,
  owner: string,
  repo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForks']['response']['data']>> => {
  const response = await client.repos.listForks({
    owner,
    repo,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const createFork = async (
  client: GithubClient,
  owner: string,
  repo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['createFork']['response']['data']>> => {
  const response = await client.repos.createFork({
    owner,
    repo,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const getDefaultBranch = async (
  client: GithubClient,
  owner: string,
  repo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['get']['response']['data']>> => {
  const response = await client.repos.get({
    owner,
    repo,
  });

  return {
    success: true,
    data: response.data,
  };
};
