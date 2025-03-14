import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { CreateCommitParams, GithubResponse } from './utils/types.js';

const logger = createLogger('github-git-tools');

/**
 * Creates a tool to get a commit from a repository
 */
export const createGetCommitTool = (
  getCommit: (
    owner: string,
    repo: string,
    commit_sha: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['git']['getCommit']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'get_commit',
    description: `Gets a commit from a repository.
    USE THIS WHEN:
    - You need to get a commit from a repository
    - You need to get the details of a specific commit
    
    IMPORTANT:
    - Make sure you have read access to the repository
    - The commit must exist
    - The commit must be in the repository
    - The commit must be in the branch
    - The commit must be in the repository
    - The commit must include the entire content of the file

    The commit must be in the repository.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      commit_sha: z.string().describe('The SHA of the commit to get'),
    }),
    func: async ({ owner, repo, commit_sha }) => {
      try {
        const { success, data } = await getCommit(owner, repo, commit_sha);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error getting commit ${commit_sha} in repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to get a reference from a repository
 */
export const createGetRefTool = (
  getRef: (
    owner: string,
    repo: string,
    ref: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['git']['getRef']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'get_ref',
    description: `Gets a reference from a repository.
    USE THIS WHEN:
    - You need to get a reference from a repository
    - You need to get the details of a specific reference

    IMPORTANT:
    - Make sure you have read access to the repository
    - The reference must exist
    - The reference must be in the repository
    - The reference must be in the branch
    - The reference must be in the repository

    The reference must be in the repository.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      ref: z.string().describe('The reference to get'),
    }),
    func: async ({ owner, repo, ref }) => {
      try {
        const { success, data } = await getRef(owner, repo, ref);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error getting reference ${ref} in repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to create a new branch in a repository
 */
export const createCreateBranchTool = (
  createBranch: (
    owner: string,
    repo: string,
    branchName: string,
    sourceBranch: string,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['git']['createRef']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'create_branch',
    description: `Creates a new branch from an existing branch in a repository.
    USE THIS WHEN:
    - You need to create a new feature branch
    - You want to create a branch for testing or development
    - You need to create a branch for a pull request
    
    IMPORTANT: Make sure you have write access to the repository.
    The source branch must exist in the repository.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      branchName: z.string().describe('The name of the new branch to create'),
      sourceBranch: z
        .string()
        .describe('The name of the source branch to create from (e.g., main)'),
    }),
    func: async ({ owner, repo, branchName, sourceBranch }) => {
      try {
        const { success, data } = await createBranch(owner, repo, branchName, sourceBranch);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(
          `Error creating branch ${branchName} from ${sourceBranch} in repository ${owner}/${repo}:`,
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
 * Creates a tool to create a commit with file changes in a repository
 */
export const createCommitTool = (
  createCommit: (
    owner: string,
    repo: string,
    params: CreateCommitParams,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['git']['updateRef']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'create_commit',
    description: `Creates a commit with file changes in a repository.
    USE THIS WHEN:
    - You need to commit one or more file changes
    - You want to update files in a branch
    - You need to make changes to the codebase
    
    IMPORTANT: 
    - Make sure you have write access to the repository
    - The branch must exist
    - All file paths must be relative to the repository root
    - File content must be the complete content of the file
    - You CANNOT use a mention like "[Rest of the content remains unchanged...]" to skip including the part of the file that has not changed
    - Make atomic, focused commits changes to a single file at a time
    - Write clear commit messages
    - Follow repository conventions
    - Always include the entire content of the file in the commit`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      branch: z.string().describe('The branch to commit to'),
      message: z.string().describe('The commit message'),
      changes: z
        .array(
          z.object({
            path: z.string().describe('The path to the file, relative to repository root'),
            content: z.string().describe('The new content of the file'),
          }),
        )
        .describe('Array of file changes to commit'),
    }),
    func: async ({ owner, repo, branch, message, changes }) => {
      try {
        const { success, data } = await createCommit(owner, repo, {
          branch,
          message,
          changes,
        });
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error creating commit in repository ${owner}/${repo}:`, error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });
