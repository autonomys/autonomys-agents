import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { GithubResponse } from './utils/types.js';

const logger = createLogger('github-repos-tools');

/**
 * Creates a tool to list public repositories for a specific user
 */
export const createListUserReposTool = (
  listUserRepos: (
    username: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForUser']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'list_user_repos',
    description: 'Lists public repositories for a specific user',
    schema: z.object({
      username: z.string().describe('The username whose repositories to list'),
    }),
    func: async ({ username }) => {
      try {
        const repos = await listUserRepos(username);
        return JSON.stringify(repos, null, 2);
      } catch (error) {
        logger.error(`Error listing repositories for user ${username}:`, error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list public repositories for a specific organization
 */
export const createListOrgReposTool = (
  listOrgRepos: (
    org: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForOrg']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'list_org_repos',
    description: 'Lists repositories for a specific organization',
    schema: z.object({
      org: z.string().describe('The organization name whose repositories to list'),
    }),
    func: async ({ org }) => {
      try {
        const repos = await listOrgRepos(org);
        return JSON.stringify(repos, null, 2);
      } catch (error) {
        logger.error(`Error listing repositories for organization ${org}:`, error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list forks of a specific repository
 */
export const createListForksTool = (
  listForks: (
    owner: string,
    repo: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['repos']['listForks']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'list_forks',
    description: 'Lists forks of a specific repository',
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
    }),
    func: async ({ owner, repo }) => {
      try {
        const forks = await listForks(owner, repo);
        return JSON.stringify(forks, null, 2);
      } catch (error) {
        logger.error(`Error listing forks for repository ${owner}/${repo}:`, error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to create a fork of a specific repository
 */
export const createForkRepoTool = (
  createFork: (
    owner: string,
    repo: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['repos']['createFork']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'fork_repo',
    description: 'Creates a fork of a repository',
    schema: z.object({
      owner: z.string().describe('The owner of the repository to fork'),
      repo: z.string().describe('The name of the repository to fork'),
    }),
    func: async ({ owner, repo }) => {
      try {
        const fork = await createFork(owner, repo);
        return JSON.stringify(fork, null, 2);
      } catch (error) {
        logger.error(`Error creating fork for repository ${owner}/${repo}:`, error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to get the default branch of a specific repository
 */
export const createGetDefaultBranchTool = (
  getDefaultBranch: (
    owner: string,
    repo: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['repos']['get']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'get_default_branch',
    description: `Gets the default branch (e.g., main or master) of a repository.
    USE THIS WHEN:
    - You need to know the main branch of a repository
    - You want to create a new branch from the default branch
    - You need to perform operations that require knowing the base branch`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
    }),
    func: async ({ owner, repo }) => {
      try {
        const defaultBranch = await getDefaultBranch(owner, repo);
        return JSON.stringify({ default_branch: defaultBranch }, null, 2);
      } catch (error) {
        logger.error(`Error getting default branch for repository ${owner}/${repo}:`, error);
        throw error;
      }
    },
  });
