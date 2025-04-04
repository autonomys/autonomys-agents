import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import {
  CreateCommentParams,
  CreateIssueParams,
  GitHubIssueAndPRState,
  GitHubReactionType,
  GithubResponse,
} from './utils/types.js';

const logger = createLogger('github-issues-tools');

/**
 * Creates a tool to list GitHub issues
 */
export const createListIssuesTools = (
  listIssues: (
    owner: string,
    repo: string,
    state: GitHubIssueAndPRState,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['issues']['listForRepo']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_issues',
    description: `List GitHub issues in the configured repository.
    USE THIS WHEN:
    - You need to see all issues in the repository
    - You want to check the status of existing issues
    - You need to check if an issue already exists before creating a new one
    - You want to find issues related to a specific topic or problem
    
    IMPORTANT: Always use this tool to check for existing issues before creating a new issue.
    This helps prevent duplicate issues and ensures you're working with the latest information.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      state: z
        .enum(['open', 'closed', 'all'])
        .describe('Filter issues by state. Default is "open".'),
    }),
    func: async ({ owner, repo, state = 'open' }) => {
      try {
        logger.info('Listing GitHub issues');
        const { success, data } = await listIssues(owner, repo, state);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub issues:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to search GitHub issues
 */
export const createSearchIssuesTools = (
  searchIssues: (
    owner: string,
    repo: string,
    query: string,
    state: GitHubIssueAndPRState,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'search_github_issues',
    description: `Search GitHub issues in the configured repository.
      USE THIS WHEN:
      - You need to search for issues in the repository
      - You want to find issues related to a specific topic or problem
      
      IMPORTANT: Always use this tool to check for existing issues before creating a new issue.
      This helps prevent duplicate issues and ensures you're working with the latest information.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      query: z.string().describe('The query to search for'),
      state: z
        .enum(['open', 'closed', 'all'])
        .describe('Filter issues by state. Default is "open".'),
    }),
    func: async ({ owner, repo, query, state = 'open' }) => {
      try {
        logger.info('Searching GitHub issues');
        const { success, data } = await searchIssues(owner, repo, query, state);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error searching GitHub issues:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to get a specific GitHub issue
 */
export const createGetIssueTools = (
  getIssue: (
    owner: string,
    repo: string,
    issue_number: number,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['issues']['get']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'get_github_issue',
    description: `Get a specific GitHub issue in the configured repository.
        USE THIS WHEN:
        - You need to get a specific issue in the repository
        - You want to see the details of a specific issue`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      issue_number: z.number().describe('The number of the issue to get'),
    }),
    func: async ({ owner, repo, issue_number }) => {
      try {
        logger.info('Getting GitHub issue:', { issue_number });
        const { success, data } = await getIssue(owner, repo, issue_number);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error getting GitHub issue:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to create a new GitHub issue
 */
export const createCreateIssueTool = (
  createIssue: (
    owner: string,
    repo: string,
    params: CreateIssueParams,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['issues']['create']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'create_github_issue',
    description: `Create a new GitHub issue in the configured repository.
    USE THIS WHEN:
    - You need to create a new issue to track work
    - You want to report a bug or request a feature
    
    IMPORTANT: Before creating a new issue, ALWAYS check for existing issues:
    - First use search_github_issues with relevant keywords to find similar issues
    - If no results, use list_github_issues to browse all open issues
    - Use clear, descriptive titles
    - Provide detailed descriptions
    - Add appropriate labels
    - Assign relevant people when necessary
    
    Only create a new issue if you've confirmed a similar issue doesn't already exist.
    If a similar issue exists, consider adding a comment to that issue instead.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      title: z.string().describe('The title of the issue'),
      body: z.string().optional().describe('The body/description of the issue'),
      labels: z.array(z.string()).optional().describe('Labels to apply to the issue'),
      assignees: z.array(z.string()).optional().describe('GitHub usernames to assign to the issue'),
    }),
    func: async ({ owner, repo, title, body, labels, assignees }) => {
      try {
        logger.info('Creating GitHub issue:', { title });
        const { success, data } = await createIssue(owner, repo, {
          title,
          body,
          labels,
          assignees,
        });
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub issue:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list comments on a GitHub issue
 */
export const createListIssueCommentsTools = (
  listIssueComments: (
    owner: string,
    repo: string,
    issue_number: number,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['issues']['listComments']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_issue_comments',
    description: `List comments on a GitHub issue in the configured repository.
    USE THIS WHEN:
    - You need to see all comments on an issue
    - You want to check if someone has already responded to an issue
    - You need to check if YOU have already commented on an issue (to avoid duplicate comments)
    - You want to read the discussion on an issue before responding
    
    IMPORTANT: ALWAYS use this tool to check for existing comments before creating a new comment on an issue. This helps prevent duplicate comments and ensures you're responding to the latest information.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      issue_number: z.number().describe('The number of the issue to list comments for'),
    }),
    func: async ({ owner, repo, issue_number }) => {
      try {
        logger.info('Listing GitHub comments:', { issue_number });
        const { success, data } = await listIssueComments(owner, repo, issue_number);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub comments:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to add a comment to a GitHub issue
 */
export const createCreateIssueCommentTool = (
  createIssueComment: (
    owner: string,
    repo: string,
    params: CreateCommentParams,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['issues']['createComment']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_issue_comment',
    description: `Create a new comment on a GitHub issue in the configured repository.
    USE THIS WHEN:
    - You need to respond to someone's comment on an issue
    - You want to add additional information to an issue
    - You need to provide an update or status report on an issue
    
    IMPORTANT: Before creating a new comment, ALWAYS follow these steps:
    1. Use list_github_comments to get all comments on the issue
    2. Check if you've already commented on this issue by looking for comments from your username
    DO NOT USE THIS TOOL IF YOU HAVE NOT ALREADY CHECKED FOR EXISTING COMMENTS USING list_github_comments.
    Avoid posting duplicate or very similar comments on the same issue.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      issue_number: z.number().describe('The number of the issue to comment on'),
      body: z.string().describe('The content of the comment'),
    }),
    func: async ({ owner, repo, issue_number, body }) => {
      try {
        logger.info('Creating GitHub issue comment:', { issue_number });
        const { success, data } = await createIssueComment(owner, repo, {
          issue_number,
          body,
        });
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub issue comment:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list reactions on a GitHub issue
 */
export const createListIssueReactionsTools = (
  listIssueReactions: (
    owner: string,
    repo: string,
    issue_number: number,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['listForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_issue_reactions',
    description: `List reactions on a GitHub issue in the configured repository.
    USE THIS WHEN:
    - You want to see all reactions on an issue
    - You need to check if someone has already reacted to an issue
    - You want to read the reactions on an issue before responding
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      issue_number: z.number().describe('The number of the issue to list reactions for'),
    }),
    func: async ({ owner, repo, issue_number }) => {
      try {
        logger.info('Listing GitHub issue reactions:', { issue_number });
        const { success, data } = await listIssueReactions(owner, repo, issue_number);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub issue reactions:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list reactions on a GitHub issue comment
 */
export const createListIssueCommentReactionsTools = (
  listIssueCommentReactions: (
    owner: string,
    repo: string,
    comment_id: number,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['listForIssueComment']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_issue_comment_reactions',
    description: `List reactions on a GitHub issue comment in the configured repository.
      USE THIS WHEN:
      - You want to see all reactions on an issue comment
      - You need to check if someone has already reacted to an issue comment
      - You want to read the reactions on an issue comment before responding
      Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      comment_id: z.number().describe('The ID of the comment to list reactions for'),
    }),
    func: async ({ owner, repo, comment_id }) => {
      try {
        logger.info('Listing GitHub issue comment reactions:', { comment_id });
        const { success, data } = await listIssueCommentReactions(owner, repo, comment_id);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub issue comment reactions:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to add a reaction to a GitHub issue
 */
export const createCreateReactionForIssueTool = (
  createIssueReaction: (
    owner: string,
    repo: string,
    issue_number: number,
    content: GitHubReactionType,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_reaction_for_issue',
    description: `Create a reaction on a GitHub issue in the configured repository.
    USE THIS WHEN:
    - You want to add an emoji reaction to an issue
    - You need to express sentiment or feedback through reactions
    Suggested behavior:
    - Don't leave reactions to your own comments or issues
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
      issue_number: z
        .number()
        .describe('The number of the issue to react to. Required if not reacting to a comment'),
    }),
    func: async ({ owner, repo, content, issue_number }) => {
      try {
        logger.info('Creating GitHub reaction:', { content, issue_number });
        const { success, data } = await createIssueReaction(owner, repo, issue_number, content);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub reaction:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to add a reaction to a GitHub issue comment
 */
export const createCreateReactionForIssueCommentTool = (
  createIssueCommentReaction: (
    owner: string,
    repo: string,
    comment_id: number,
    content: GitHubReactionType,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_reaction_for_issue_comment',
    description: `Create a reaction on a GitHub issue comment in the configured repository.
    USE THIS WHEN:
    - You want to add an emoji reaction to an issue comment
    - You need to express sentiment or feedback through reactions
    Suggested behavior:
    - Don't leave reactions to your own comments or issues
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
      comment_id: z
        .number()
        .describe('The ID of the comment to react to. Required if not reacting to an issue'),
    }),
    func: async ({ owner, repo, content, comment_id }) => {
      try {
        logger.info('Creating GitHub reaction:', { content, comment_id });
        const { success, data } = await createIssueCommentReaction(
          owner,
          repo,
          comment_id,
          content,
        );
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub reaction:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });
