import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { CreateCommitParams, GithubResponse } from './utils/types.js';

const logger = createLogger('github-git-tools');

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
    - File content must be the complete new content of the file`,
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
