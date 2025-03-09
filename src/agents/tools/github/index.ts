import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import {
  CommentInfo,
  CreateCommentParams,
  CreateIssueParams,
  CreateReactionParams,
  githubClient,
  IssueInfo,
  ReactionInfo,
} from './client.js';

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

/**
 * Creates a tool to list comments on a GitHub issue
 */
export const createListCommentsTools = (
  listComments: (issue_number: number) => Promise<CommentInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'list_github_comments',
    description: `List comments on a specific GitHub issue in the configured repository.
    USE THIS WHEN:
    - You need to check for new comments or responses on an issue
    - You want to see the discussion history of an issue
    - You need to track if someone has replied to an issue`,
    schema: z.object({
      issue_number: z.number().describe('The number of the issue to get comments from'),
    }),
    func: async ({ issue_number }) => {
      try {
        logger.info('Listing GitHub issue comments:', { issue_number });
        const comments = await listComments(issue_number);
        return {
          success: true,
          comments,
        };
      } catch (error) {
        logger.error('Error listing GitHub comments:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to add a comment to a GitHub issue
 */
export const createCreateCommentTool = (
  createComment: (params: CreateCommentParams) => Promise<CommentInfo>,
) =>
  new DynamicStructuredTool({
    name: 'create_github_comment',
    description: `Create a new comment on a GitHub issue in the configured repository.
    USE THIS WHEN:
    - You need to respond to someone's comment on an issue
    - You want to add additional information to an issue
    - You need to provide an update or status report on an issue`,
    schema: z.object({
      issue_number: z.number().describe('The number of the issue to comment on'),
      body: z.string().describe('The content of the comment'),
    }),
    func: async ({ issue_number, body }) => {
      try {
        logger.info('Creating GitHub comment:', { issue_number });
        const comment = await createComment({ issue_number, body });
        return {
          success: true,
          comment,
        };
      } catch (error) {
        logger.error('Error creating GitHub comment:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to add a reaction to a GitHub issue or comment
 */
export const createCreateReactionTool = (
  createReaction: (params: CreateReactionParams) => Promise<ReactionInfo>,
) =>
  new DynamicStructuredTool({
    name: 'create_github_reaction',
    description: `Create a reaction on a GitHub issue or comment in the configured repository.
    USE THIS WHEN:
    - You want to add an emoji reaction to an issue or comment
    - You need to express sentiment or feedback through reactions
    Suggested behavior:
    - Don't leave reactions to your own comments or issues
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
      issue_number: z
        .number()
        .optional()
        .describe('The number of the issue to react to. Required if not reacting to a comment'),
      comment_id: z
        .number()
        .optional()
        .describe('The ID of the comment to react to. Required if not reacting to an issue'),
    }),
    func: async ({ content, issue_number, comment_id }) => {
      try {
        logger.info('Creating GitHub reaction:', { content, issue_number, comment_id });
        const reaction = await createReaction({ content, issue_number, comment_id });
        return {
          success: true,
          reaction,
        };
      } catch (error) {
        logger.error('Error creating GitHub reaction:', error);
        throw error;
      }
    },
  });

export const createGitHubTools = async (token: string, owner: string, repo: string) => {
  const github = await githubClient(token, owner, repo);
  const listIssues = (state?: 'open' | 'closed' | 'all') => github.listIssues(state);
  const createIssue = (params: CreateIssueParams) => github.createIssue(params);
  const listComments = (issue_number: number) => github.listComments(issue_number);
  const createComment = (params: CreateCommentParams) => github.createComment(params);
  const createReaction = (params: CreateReactionParams) => github.createReaction(params);

  return [
    createListIssuesTools(listIssues),
    createCreateIssueTool(createIssue),
    createListCommentsTools(listComments),
    createCreateCommentTool(createComment),
    createCreateReactionTool(createReaction),
  ];
};
