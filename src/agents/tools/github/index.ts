import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import {
  CommentInfo,
  CreateCommentParams,
  CreateIssueParams,
  CreatePRCommentParams,
  CreateReactionParams,
  githubClient,
  IssueInfo,
  MentionInfo,
  NotificationInfo,
  PRCommentInfo,
  PullRequestInfo,
  ReactionInfo,
  WatchedRepoInfo,
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

/**
 * Creates a tool to list GitHub mentions
 */
export const createListMentionsTool = (listMentions: () => Promise<MentionInfo[]>) =>
  new DynamicStructuredTool({
    name: 'list_github_mentions',
    description: `List GitHub issues and pull requests where you are mentioned.
    USE THIS WHEN:
    - You want to check where you've been mentioned
    - You need to find discussions you're involved in
    - You want to track conversations where someone has tagged you`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Listing GitHub mentions');
        const mentions = await listMentions();
        return {
          success: true,
          mentions,
        };
      } catch (error) {
        logger.error('Error listing GitHub mentions:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list GitHub notifications
 */
export const createListNotificationsTool = (
  listNotifications: (all?: boolean) => Promise<NotificationInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'list_github_notifications',
    description: `List GitHub notifications for the authenticated user.
    USE THIS WHEN:
    - You want to check your unread notifications
    - You need to stay updated on repository activities
    - You want to see all notifications, including read ones`,
    schema: z.object({
      all: z
        .boolean()
        .optional()
        .describe('If true, show all notifications. If false, show only unread notifications.'),
    }),
    func: async ({ all = false }) => {
      try {
        logger.info('Listing GitHub notifications:', { all });
        const notifications = await listNotifications(all);
        return {
          success: true,
          notifications,
        };
      } catch (error) {
        logger.error('Error listing GitHub notifications:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list GitHub pull requests
 */
export const createListPullRequestsTool = (
  listPullRequests: (state?: 'open' | 'closed' | 'all') => Promise<PullRequestInfo[]>,
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
        const prs = await listPullRequests(state);
        return {
          success: true,
          pull_requests: prs,
        };
      } catch (error) {
        logger.error('Error listing GitHub pull requests:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to get a specific GitHub pull request
 */
export const createGetPullRequestTool = (
  getPullRequest: (pull_number: number) => Promise<PullRequestInfo>,
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
        const pr = await getPullRequest(pull_number);
        return {
          success: true,
          pull_request: pr,
        };
      } catch (error) {
        logger.error('Error getting GitHub pull request:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list comments on a GitHub pull request
 */
export const createListPRCommentsTool = (
  listPRComments: (pull_number: number) => Promise<PRCommentInfo[]>,
) =>
  new DynamicStructuredTool({
    name: 'list_github_pr_comments',
    description: `List comments on a specific GitHub pull request.
    USE THIS WHEN:
    - You need to check for review comments on a PR
    - You want to see the discussion history of a PR
    - You need to track if someone has replied to your PR comments`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request to get comments from'),
    }),
    func: async ({ pull_number }) => {
      try {
        logger.info('Listing GitHub PR comments:', { pull_number });
        const comments = await listPRComments(pull_number);
        return {
          success: true,
          comments,
        };
      } catch (error) {
        logger.error('Error listing GitHub PR comments:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to comment on a GitHub pull request
 */
export const createCreatePRCommentTool = (
  createPRComment: (params: CreatePRCommentParams) => Promise<PRCommentInfo>,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pr_comment',
    description: `Create a new comment on a GitHub pull request.
    USE THIS WHEN:
    - You need to respond to a PR review or discussion
    - You want to provide feedback on specific code changes
    - You need to add information or suggestions to a PR
    
    Note: To comment on specific lines of code, provide the path, line, and commit_id.
    For general PR comments, only pull_number and body are required.`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request to comment on'),
      body: z.string().describe('The content of the comment'),
      commit_id: z
        .string()
        .optional()
        .describe('The commit SHA to comment on (required for line comments)'),
      path: z.string().optional().describe('The file path to comment on'),
      line: z.number().optional().describe('The line number to comment on'),
      side: z
        .enum(['LEFT', 'RIGHT'])
        .optional()
        .describe('Which version of the line to comment on (LEFT for previous, RIGHT for current)'),
    }),
    func: async ({ pull_number, body, commit_id, path, line, side }) => {
      try {
        logger.info('Creating GitHub PR comment:', { pull_number });
        const comment = await createPRComment({ pull_number, body, commit_id, path, line, side });
        return {
          success: true,
          comment,
        };
      } catch (error) {
        logger.error('Error creating GitHub PR comment:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to add a reaction to a GitHub pull request comment
 */
export const createCreatePRReactionTool = (
  createPRReaction: (
    params: CreateReactionParams & { pull_number: number },
  ) => Promise<ReactionInfo>,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pr_reaction',
    description: `Create a reaction on a GitHub pull request comment.
    USE THIS WHEN:
    - You want to add an emoji reaction to a PR comment
    - You need to express sentiment or feedback through reactions on PR discussions
    
    Available reactions: +1, -1, laugh, confused, heart, hooray, rocket, eyes`,
    schema: z.object({
      pull_number: z.number().describe('The number of the pull request'),
      comment_id: z.number().describe('The ID of the comment to react to'),
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
    }),
    func: async ({ pull_number, comment_id, content }) => {
      try {
        logger.info('Creating GitHub PR reaction:', { pull_number, comment_id, content });
        const reaction = await createPRReaction({ pull_number, comment_id, content });
        return {
          success: true,
          reaction,
        };
      } catch (error) {
        logger.error('Error creating GitHub PR reaction:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to watch a GitHub repository
 */
export const createWatchRepoTool = (
  watchRepo: (owner: string, repo: string, ignored?: boolean) => Promise<void>,
) =>
  new DynamicStructuredTool({
    name: 'watch_github_repository',
    description: `Watch a GitHub repository to receive notifications about its activity.
    USE THIS WHEN:
    - You want to start monitoring a repository
    - You need to track changes and updates in a repository
    - You want to receive notifications about issues, PRs, and other activities
    
    Note: You can optionally set 'ignored' to true to watch without receiving notifications.`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository to watch'),
      repo: z.string().describe('The name of the repository to watch'),
      ignored: z
        .boolean()
        .optional()
        .describe(
          'If true, watch the repository but do not receive notifications. Default is false.',
        ),
    }),
    func: async ({ owner, repo, ignored = false }) => {
      try {
        logger.info('Watching GitHub repository:', { owner, repo, ignored });
        await watchRepo(owner, repo, ignored);
        return {
          success: true,
          message: `Successfully watched repository ${owner}/${repo}`,
        };
      } catch (error) {
        logger.error('Error watching GitHub repository:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to unwatch a GitHub repository
 */
export const createUnwatchRepoTool = (
  unwatchRepo: (owner: string, repo: string) => Promise<void>,
) =>
  new DynamicStructuredTool({
    name: 'unwatch_github_repository',
    description: `Stop watching a GitHub repository.
    USE THIS WHEN:
    - You want to stop monitoring a repository
    - You no longer need notifications from a repository
    - You want to clean up your watched repositories list`,
    schema: z.object({
      owner: z.string().describe('The owner of the repository to unwatch'),
      repo: z.string().describe('The name of the repository to unwatch'),
    }),
    func: async ({ owner, repo }) => {
      try {
        logger.info('Un-watching GitHub repository:', { owner, repo });
        await unwatchRepo(owner, repo);
        return {
          success: true,
          message: `Successfully unwatched repository ${owner}/${repo}`,
        };
      } catch (error) {
        logger.error('Error un-watching GitHub repository:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to list watched GitHub repositories
 */
export const createListWatchedReposTool = (listWatchedRepos: () => Promise<WatchedRepoInfo[]>) =>
  new DynamicStructuredTool({
    name: 'list_watched_github_repositories',
    description: `List all GitHub repositories you are watching.
    USE THIS WHEN:
    - You want to see all repositories you're watching
    - You need to check your notification settings for repositories
    - You want to review which repositories you're monitoring`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Listing watched GitHub repositories');
        const repos = await listWatchedRepos();
        return {
          success: true,
          watched_repositories: repos,
        };
      } catch (error) {
        logger.error('Error listing watched GitHub repositories:', error);
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
  const listMentions = () => github.listMentions();
  const listNotifications = (all?: boolean) => github.listNotifications(all);
  const listPullRequests = (state?: 'open' | 'closed' | 'all') => github.listPullRequests(state);
  const getPullRequest = (pull_number: number) => github.getPullRequest(pull_number);
  const listPRComments = (pull_number: number) => github.listPRComments(pull_number);
  const createPRComment = (params: CreatePRCommentParams) => github.createPRComment(params);
  const createPRReaction = (params: CreateReactionParams & { pull_number: number }) =>
    github.createPRReaction(params);
  const watchRepo = (targetOwner: string, targetRepo: string, ignored?: boolean) =>
    github.watchRepo(targetOwner, targetRepo, ignored);
  const unwatchRepo = (targetOwner: string, targetRepo: string) =>
    github.unwatchRepo(targetOwner, targetRepo);
  const listWatchedRepos = () => github.listWatchedRepos();

  return [
    createListIssuesTools(listIssues),
    createCreateIssueTool(createIssue),
    createListCommentsTools(listComments),
    createCreateCommentTool(createComment),
    createCreateReactionTool(createReaction),
    createListMentionsTool(listMentions),
    createListNotificationsTool(listNotifications),
    createListPullRequestsTool(listPullRequests),
    createGetPullRequestTool(getPullRequest),
    createListPRCommentsTool(listPRComments),
    createCreatePRCommentTool(createPRComment),
    createCreatePRReactionTool(createPRReaction),
    createWatchRepoTool(watchRepo),
    createUnwatchRepoTool(unwatchRepo),
    createListWatchedReposTool(listWatchedRepos),
  ];
};
