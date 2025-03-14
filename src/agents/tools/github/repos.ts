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
        const { success, data } = await listUserRepos(username);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error listing repositories for user ${username}:`, error);
        return {
          success: false,
          error: error as Error,
        };
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
        const { success, data } = await listOrgRepos(org);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error listing repositories for organization ${org}:`, error);
        return {
          success: false,
          error: error as Error,
        };
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
        const { success, data } = await listForks(owner, repo);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error listing forks for repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
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
        const { success, data } = await createFork(owner, repo);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error creating fork for repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
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
        const { success, data } = await getDefaultBranch(owner, repo);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error getting default branch for repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to get a specific branch of a repository
 */
export const createGetRepoBranchTool = (
  getRepoBranch: (
    owner: string,
    repo: string,
    branch: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['repos']['getBranch']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'get_repo_branch',
    description: 'Gets a specific branch of a repository',
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      branch: z.string().describe('The name of the branch to get (e.g., main, master, etc.)'),
    }),
    func: async ({ owner, repo, branch }) => {
      try {
        const { success, data } = await getRepoBranch(owner, repo, branch);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error getting branch ${branch} for repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to get the content of a specific branch of a repository
 */
export const createGetRepoRefContentTool = (
  getRepoRefContent: (
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['repos']['getContent']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'get_repo_ref_content',
    description: `Gets the content of a specific branch of a repository
    USE THIS WHEN:
    - You need to get the content of a specific file in a repository
    - You need to get the content of a specific directory in a repository
    This will return the content of the file or directory in the branch specified by the ref parameter and path parameter
    `,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      path: z.string().describe('The path to the file to get'),
      ref: z.string().describe('The reference to the branch to get (e.g., main, master, etc.)'),
    }),
    func: async ({ owner, repo, path, ref }) => {
      try {
        const { success, data } = await getRepoRefContent(owner, repo, path, ref);
        // The content is Base64 encoded
        if (data && 'content' in data)
          return {
            success,
            data: Buffer.from(data.content, 'base64').toString(),
          };
        // The content is likely a directory
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(
          `Error getting content for repository ${owner}/${repo} at path ${path} and ref ${ref}:`,
          error,
        );
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list contributors to a repository
 */
export const createListContributorsTool = (
  listContributors: (
    owner: string,
    repo: string,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['repos']['listContributors']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_contributors',
    description: 'Lists contributors to a repository',
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
    }),
    func: async ({ owner, repo }) => {
      try {
        const { success, data } = await listContributors(owner, repo);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error listing contributors for repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to add a collaborator to a repository
 */
export const createAddCollaboratorTool = (
  addCollaborator: (
    owner: string,
    repo: string,
    username: string,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['repos']['addCollaborator']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'add_collaborator',
    description: 'Adds a collaborator to a repository',
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      username: z.string().describe('The username of the collaborator to add'),
    }),
    func: async ({ owner, repo, username }) => {
      try {
        const { success, data } = await addCollaborator(owner, repo, username);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(
          `Error adding collaborator ${username} to repository ${owner}/${repo}:`,
          error,
        );
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to remove a collaborator from a repository
 */
export const createRemoveCollaboratorTool = (
  removeCollaborator: (
    owner: string,
    repo: string,
    username: string,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['repos']['removeCollaborator']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'remove_collaborator',
    description: 'Removes a collaborator from a repository',
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      username: z.string().describe('The username of the collaborator to remove'),
    }),
    func: async ({ owner, repo, username }) => {
      try {
        const { success, data } = await removeCollaborator(owner, repo, username);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(
          `Error removing collaborator ${username} from repository ${owner}/${repo}:`,
          error,
        );
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to compare two commits
 */
export const createCompareCommitsTool = (
  compareCommits: (
    owner: string,
    repo: string,
    base: string,
    head: string,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['repos']['compareCommits']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'compare_commits',
    description: 'Compares two commits',
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      base: z.string().describe('The base commit'),
      head: z.string().describe('The head commit'),
    }),
    func: async ({ owner, repo, base, head }) => {
      try {
        const { success, data } = await compareCommits(owner, repo, base, head);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(
          `Error comparing commits ${base} and ${head} for repository ${owner}/${repo}:`,
          error,
        );
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });
