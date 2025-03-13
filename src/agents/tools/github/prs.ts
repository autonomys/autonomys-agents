import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import {
  CreatePRCommentParams,
  CreatePullRequestParams,
  GitHubIssueAndPRState,
  GitHubReactionType,
  GithubResponse,
} from './utils/types.js';

const logger = createLogger('github-prs-tools');

/**
 * Creates a tool to list GitHub pull requests
 */
export const createListPullRequestsTool = (
  listPullRequests: (
    state: GitHubIssueAndPRState,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['pulls']['list']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'list_github_pull_requests',
    description: `List GitHub pull requests in the configured repository.
    USE THIS WHEN:
    - You need to see all pull requests in the repository
    - You want to check the status of existing PRs
    - You need to find PRs you're assigned to or need to review`,
    schema: z.object({
      state: z
        .enum(['open', 'closed', 'all'])
        .optional()
        .describe('Filter pull requests by state. Default is "open".'),
    }),
    func: async ({ state = 'open' }) => {
      try {
        logger.info('Listing GitHub pull requests');
        const { success, data } = await listPullRequests(state);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub pull requests:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to search GitHub pull requests
 */
export const createSearchPullRequestsTools = (
  searchPullRequests: (
    query: string,
    state: GitHubIssueAndPRState,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'search_github_pull_requests',
    description: `Search for GitHub pull requests in the configured repository by keywords.
      USE THIS WHEN:
      - You need to find pull requests related to specific topics or keywords
      - You want to check if a pull request already exists before creating a new one
      - You need to find pull requests with specific words in the title or body
      
      IMPORTANT: Always use this tool to search for existing pull requests before creating a new pull request.
      This is more effective than just listing all pull requests, as it allows you to find pull requests by keywords.
      Search for keywords related to the pull request you're considering creating.`,
    schema: z.object({
      query: z.string().describe('Keywords to search for in pull request titles and bodies'),
      state: z
        .enum(['open', 'closed', 'all'])
        .describe('Filter pull requests by state. Default is "open".'),
    }),
    func: async ({ query, state = 'open' }) => {
      try {
        logger.info('Searching GitHub pull requests:', { query, state });
        const { success, data } = await searchPullRequests(query, state);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error searching GitHub pull requests:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to get a specific GitHub pull request
 */
export const createGetPullRequestTool = (
  getPullRequest: (
    pull_number: number,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['pulls']['get']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'get_github_pull_request',
    description: `Get details of a specific GitHub pull request.
    USE THIS WHEN:
    - You need detailed information about a specific PR
    - You want to check who is assigned or reviewing a PR
    - You need to verify the current state of a PR`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request to get'),
    }),
    func: async ({ pull_number }) => {
      try {
        logger.info('Getting GitHub pull request:', { pull_number });
        const { success, data } = await getPullRequest(pull_number);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error getting GitHub pull request:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to create a new GitHub pull request
 */
export const createCreatePullRequestTool = (
  createPullRequest: (
    params: CreatePullRequestParams,
  ) => Promise<GithubResponse<RestEndpointMethodTypes['pulls']['create']['response']['data']>>,
) =>
  new DynamicStructuredTool({
    name: 'create_pull_request',
    description: `Creates a new pull request in a repository.
      USE THIS WHEN:
      - You want to merge changes from one branch to another
      - You have completed your feature work and want to request a review
      - You want to propose changes to a repository
      
      IMPORTANT: 
      - The head branch must exist and contain the changes you want to merge
      - The base branch is where you want to merge your changes into
      - You can create a draft PR by setting draft to true
      - Make sure your commit changes are pushed to the head branch before creating the PR`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository'),
      repo: z.string().describe('The name of the repository'),
      title: z.string().describe('The title of the pull request'),
      body: z.string().optional().describe('The description of the pull request'),
      head: z.string().describe('The name of the branch where your changes are implemented'),
      base: z.string().describe('The name of the branch you want your changes pulled into'),
      draft: z.boolean().optional().describe('Whether to create the pull request as a draft'),
      maintainer_can_modify: z
        .boolean()
        .optional()
        .describe('Whether maintainers can modify the pull request'),
    }),
    func: async params => {
      try {
        const { success, data } = await createPullRequest(params);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error(`Error creating pull request:`, error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list comments on a GitHub pull request
 */
export const createListPullRequestCommentsTool = (
  listPRComments: (
    pull_number: number,
  ) => Promise<
    GithubResponse<
      (
        | RestEndpointMethodTypes['issues']['listComments']['response']['data'][number]
        | RestEndpointMethodTypes['pulls']['listReviewComments']['response']['data'][number]
      )[]
    >
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_pull_request_comments',
    description: `List comments on a GitHub pull request in the configured repository.
    USE THIS WHEN:
    - You need to see all comments on a pull request
    - You want to check if someone has already reviewed or commented on a PR
    - You need to check if YOU have already commented on a PR (to avoid duplicate comments)
    - You want to read the discussion on a PR before responding
    
    IMPORTANT: ALWAYS USE THIS TOOL to check for existing comments BEFORE creating a new comment on a pull request. This helps prevent duplicate comments and ensures you're responding to the latest information.`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request to list comments for'),
    }),
    func: async ({ pull_number }) => {
      try {
        logger.info('Listing GitHub pull request comments:', { pull_number });
        const { success, data } = await listPRComments(pull_number);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub pull request comments:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to comment on a GitHub pull request
 */
export const createCreatePullRequestCommentTool = (
  createPullRequestComment: (
    params: CreatePRCommentParams,
  ) => Promise<
    GithubResponse<
      | RestEndpointMethodTypes['issues']['createComment']['response']['data']
      | RestEndpointMethodTypes['pulls']['createReviewComment']['response']['data']
    >
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pull_request_comment',
    description: `Create a new comment on a GitHub pull request in the configured repository.
    USE THIS WHEN:
    - You need to provide feedback on a pull request
    - You want to suggest changes to code in a pull request
    - You need to ask questions about a pull request
    
    IMPORTANT: Before creating a new comment, ALWAYS follow these steps:
    1. Use list_github_pull_request_comments to get all comments on the pull request
    2. Check if you've already commented on this PR by looking for comments from your username
    DO NOT USE THIS TOOL IF YOU HAVE NOT ALREADY CHECKED FOR EXISTING COMMENTS USING list_github_pr_comments.
    
    Avoid posting duplicate or very similar comments on the same pull request.`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request to comment on'),
      body: z.string().describe('The content of the comment'),
      commit_id: z
        .string()
        .optional()
        .describe('The SHA of the commit to comment on (for review comments)'),
      path: z
        .string()
        .optional()
        .describe('The relative file path to comment on (for review comments)'),
      line: z
        .number()
        .optional()
        .describe('The line number in the file to comment on (for review comments)'),
      side: z
        .enum(['LEFT', 'RIGHT'])
        .optional()
        .describe(
          'Which side of a diff to comment on. LEFT is for deletions, RIGHT is for additions. Default is RIGHT.',
        ),
    }),
    func: async ({ pull_number, body, commit_id, path, line, side }) => {
      try {
        logger.info('Creating GitHub pull request comment:', { pull_number });
        const { success, data } = await createPullRequestComment({
          pull_number,
          body,
          commit_id,
          path,
          line,
          side,
        });
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub pull request comment:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list reactions to a GitHub pull request
 */
export const createListPullRequestReactionsTool = (
  listPullRequestReactions: (
    pull_number: number,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['listForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_pull_request_reactions',
    description: `List reactions on a GitHub pull request.
    USE THIS WHEN:
    - You want to see all reactions on a pull request
    - You need to check if someone has already reacted to a pull request
    - You want to read the reactions on a pull request before responding`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request'),
    }),
    func: async ({ pull_number }) => {
      try {
        logger.info('Listing GitHub pull request reactions:', { pull_number });
        const { success, data } = await listPullRequestReactions(pull_number);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub pull request reactions:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list reactions to a GitHub pull request comment
 */
export const createListPullRequestCommentReactionsTool = (
  listPullRequestCommentReactions: (
    comment_id: number,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['listForIssueComment']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_pull_request_comment_reactions',
    description: `List reactions on a GitHub pull request comment.
      USE THIS WHEN:
      - You want to see all reactions on a pull request comment
      - You need to check if someone has already reacted to a pull request comment
      - You want to read the reactions on a pull request comment before responding`,
    schema: z.object({
      comment_id: z.number().describe('The number of the pull request comment'),
    }),
    func: async ({ comment_id }) => {
      try {
        logger.info('Listing GitHub pull request comment reactions:', { comment_id });
        const { success, data } = await listPullRequestCommentReactions(comment_id);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub pull request comment reactions:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to list reactions to a GitHub pull request comment
 */
export const createListPullRequestReviewCommentReactionsTool = (
  listPullRequestReviewCommentReactions: (
    pull_number: number,
    comment_id: number,
  ) => Promise<
    GithubResponse<
      RestEndpointMethodTypes['reactions']['listForPullRequestReviewComment']['response']['data']
    >
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_pull_request_review_comment_reactions',
    description: `List reactions on a GitHub pull request review comment.
        USE THIS WHEN:
        - You want to see all reactions on a pull request review comment
        - You need to check if someone has already reacted to a pull request review comment
        - You want to read the reactions on a pull request review comment before responding`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request'),
      comment_id: z.number().describe('The number of the pull request review comment'),
    }),
    func: async ({ pull_number, comment_id }) => {
      try {
        logger.info('Listing GitHub pull request review comment reactions:', {
          pull_number,
          comment_id,
        });
        const { success, data } = await listPullRequestReviewCommentReactions(
          pull_number,
          comment_id,
        );
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error listing GitHub pull request review comment reactions:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to add a reaction to a GitHub pull request
 */
export const createCreateReactionForPullRequestTool = (
  createPullRequestReaction: (
    pull_number: number,
    content: GitHubReactionType,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pull_request_reaction',
    description: `Create a reaction on a GitHub pull request.
    USE THIS WHEN:
    - You want to add an emoji reaction to a PR
    - You need to express sentiment or feedback on a PR through reactions
    
    IMPORTANT: Before adding a reaction, consider whether you've already reacted to this PR. Avoid adding multiple reactions to the same content. Remember that you can only add each reaction type once per PR.
    
    Suggested behavior:
    - Don't leave reactions to your own PRs
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
      pull_number: z.number().describe('The number of the pull request'),
    }),
    func: async ({ content, pull_number }) => {
      try {
        logger.info('Creating GitHub PR reaction:', { content, pull_number });
        const { success, data } = await createPullRequestReaction(pull_number, content);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub PR reaction:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to add a reaction to a GitHub pull request comment
 */
export const createCreateReactionForPullRequestCommentTool = (
  createPullRequestCommentReaction: (
    comment_id: number,
    content: GitHubReactionType,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pull_request_comment_reaction',
    description: `Create a reaction on a GitHub pull request comment.
    USE THIS WHEN:
    - You want to add an emoji reaction to a PR comment
    - You need to express sentiment or feedback on a PR comment through reactions
    
    IMPORTANT: Before adding a reaction, consider whether you've already reacted to this PR comment. Avoid adding multiple reactions to the same content. Remember that you can only add each reaction type once per comment.
    
    Suggested behavior:
    - Don't leave reactions to your own comments
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
      comment_id: z.number().describe('The number of the pull request comment'),
    }),
    func: async ({ content, comment_id }) => {
      try {
        logger.info('Creating GitHub PR comment reaction:', { content, comment_id });
        const { success, data } = await createPullRequestCommentReaction(comment_id, content);
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub PR comment reaction:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });

/**
 * Creates a tool to add a reaction to a GitHub pull request review comment
 */
export const createCreateReactionForPullRequestReviewCommentTool = (
  createPullRequestReviewCommentReaction: (
    pull_number: number,
    comment_id: number,
    content: GitHubReactionType,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pull_request_review_comment_reaction',
    description: `Create a reaction on a GitHub pull request review comment.
    USE THIS WHEN:
    - You want to add an emoji reaction to a PR review comment
    - You need to express sentiment or feedback on a PR review comment through reactions
    
    IMPORTANT: Before adding a reaction, consider whether you've already reacted to this PR review comment. Avoid adding multiple reactions to the same content. Remember that you can only add each reaction type once per comment.
    
    Suggested behavior:
    - Don't leave reactions to your own comments
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
      pull_number: z.number().describe('The number of the pull request'),
      comment_id: z.number().describe('The number of the pull request review comment'),
    }),
    func: async ({ content, pull_number, comment_id }) => {
      try {
        logger.info('Creating GitHub PR review comment reaction:', {
          content,
          pull_number,
          comment_id,
        });
        const { success, data } = await createPullRequestReviewCommentReaction(
          pull_number,
          comment_id,
          content,
        );
        return {
          success,
          data: JSON.stringify(data, null, 2),
        };
      } catch (error) {
        logger.error('Error creating GitHub PR review comment reaction:', error);
        return {
          success: false,
          error: error as Error,
        };
      }
    },
  });
