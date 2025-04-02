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

export const getRepoBranch = async (
  client: GithubClient,
  owner: string,
  repo: string,
  branch: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['getBranch']['response']['data']>> => {
  const response = await client.repos.getBranch({ owner, repo, branch });
  return {
    success: true,
    data: response.data,
  };
};

export const getRepoRefContent = async (
  client: GithubClient,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['getContent']['response']['data']>> => {
  const { data } = await client.repos.getContent({ owner, repo, path, ref });
  return {
    success: true,
    data: data,
  };
};

export const listContributors = async (
  client: GithubClient,
  owner: string,
  repo: string,
): Promise<
  GithubResponse<RestEndpointMethodTypes['repos']['listContributors']['response']['data']>
> => {
  const response = await client.repos.listContributors({ owner, repo });
  return {
    success: true,
    data: response.data,
  };
};

export const addCollaborator = async (
  client: GithubClient,
  owner: string,
  repo: string,
  username: string,
): Promise<
  GithubResponse<RestEndpointMethodTypes['repos']['addCollaborator']['response']['data']>
> => {
  const response = await client.repos.addCollaborator({ owner, repo, username });
  return {
    success: true,
    data: response.data,
  };
};

export const removeCollaborator = async (
  client: GithubClient,
  owner: string,
  repo: string,
  username: string,
): Promise<
  GithubResponse<RestEndpointMethodTypes['repos']['removeCollaborator']['response']['data']>
> => {
  const response = await client.repos.removeCollaborator({ owner, repo, username });
  return {
    success: true,
    data: response.data,
  };
};

export const compareCommits = async (
  client: GithubClient,
  owner: string,
  repo: string,
  base: string,
  head: string,
): Promise<
  GithubResponse<RestEndpointMethodTypes['repos']['compareCommits']['response']['data']>
> => {
  const response = await client.repos.compareCommits({ owner, repo, base, head });
  return {
    success: true,
    data: response.data,
  };
};
