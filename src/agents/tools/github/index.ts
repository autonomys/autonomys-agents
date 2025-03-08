import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { CreateIssueParams, githubClient, IssueInfo } from './client.js';

const logger = createLogger('github-tools');

/**
 * Creates a tool to list GitHub issues
 */
export const createListIssuesTools = (
  listIssues: (state?: 'open' | 'closed' | 'all') => Promise<IssueInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'list_github_issues',
    description: `List GitHub issues in the configured repository.
    USE THIS WHEN:
    - You need to see all issues in the repository
    - You want to check the status of existing issues`,
    schema: z.object({
      state: z
        .enum(['open', 'closed', 'all'])
        .optional()
        .describe('Filter issues by state. Default is "open".'),
    }),
    func: async ({ state = 'open' }) => {
      try {
        logger.info('Listing GitHub issues');
        const issues = await listIssues(state);
        return {
          success: true,
          issues,
        };
      } catch (error) {
        logger.error('Error listing GitHub issues:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to create a new GitHub issue
 */
export const createCreateIssueTool = (
  createIssue: (params: CreateIssueParams) => Promise<IssueInfo>,
) =>
  new DynamicStructuredTool({
    name: 'create_github_issue',
    description: `Create a new GitHub issue in the configured repository.
    USE THIS WHEN:
    - You need to create a new issue to track work
    - You want to report a bug or request a feature`,
    schema: z.object({
      title: z.string().describe('The title of the issue'),
      body: z.string().optional().describe('The body/description of the issue'),
      labels: z.array(z.string()).optional().describe('Labels to apply to the issue'),
      assignees: z.array(z.string()).optional().describe('GitHub usernames to assign to the issue'),
    }),
    func: async ({ title, body, labels, assignees }) => {
      try {
        logger.info('Creating GitHub issue:', { title });
        const issue = await createIssue({ title, body, labels, assignees });
        return {
          success: true,
          issue,
        };
      } catch (error) {
        logger.error('Error creating GitHub issue:', error);
        throw error;
      }
    },
  });

export const createGitHubTools = async (token: string, owner: string, repo: string) => {
  const github = await githubClient(token, owner, repo);
  const listIssues = (state?: 'open' | 'closed' | 'all') => github.listIssues(state);
  const createIssue = (params: CreateIssueParams) => github.createIssue(params);

  return [createListIssuesTools(listIssues), createCreateIssueTool(createIssue)];
};
