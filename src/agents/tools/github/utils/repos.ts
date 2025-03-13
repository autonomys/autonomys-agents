import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import { GithubClientWithOptions, GithubResponse } from './types.js';

const logger = createLogger('github-repos');

export const listUserRepos = async (
  client: GithubClientWithOptions,
  username: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForUser']['response']['data']>> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.repos.listForUser({ username });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub user repositories:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const listOrgRepos = async (
  client: GithubClientWithOptions,
  org: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForOrg']['response']['data']>> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.repos.listForOrg({ org });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub organization repositories:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const listForks = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForks']['response']['data']>> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.repos.listForks({
      owner: targetOwner,
      repo: targetRepo,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub forks:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const createFork = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['createFork']['response']['data']>> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.repos.createFork({
      owner: targetOwner,
      repo: targetRepo,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error creating GitHub fork:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const getDefaultBranch = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
): Promise<GithubResponse<RestEndpointMethodTypes['repos']['get']['response']['data']>> => {
  const { githubClient } = client;
  try {
    const response = await githubClient.repos.get({
      owner: targetOwner,
      repo: targetRepo,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error getting default branch for repository:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};
