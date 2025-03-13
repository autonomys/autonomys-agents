import { DynamicStructuredTool } from '@langchain/core/tools';
import { RestEndpointMethodTypes } from '@octokit/rest';
import { z } from 'zod';
import { createLogger } from '../../../utils/logger.js';
import { githubClient } from './utils/client.js';
import {
  CreateCommentParams,
  CreateCommitParams,
  CreateIssueParams,
  CreatePRCommentParams,
  CreatePullRequestParams,
  GitHubIssueAndPRState,
  GitHubReactionType,
  GithubResponse,
} from './utils/types.js';

const logger = createLogger('github-tools');

/**
 * Creates a tool to list GitHub issues
 */
export const createListIssuesTools = (
  listIssues: (
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
      state: z
        .enum(['open', 'closed', 'all'])
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
  createIssue: (
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
    1. First use search_github_issues with relevant keywords to find similar issues
    2. If no results, use list_github_issues to browse all open issues
    
    Only create a new issue if you've confirmed a similar issue doesn't already exist.
    If a similar issue exists, consider adding a comment to that issue instead.`,
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
  listComments: (
    issue_number: number,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['issues']['listComments']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_github_comments',
    description: `List comments on a GitHub issue in the configured repository.
    USE THIS WHEN:
    - You need to see all comments on an issue
    - You want to check if someone has already responded to an issue
    - You need to check if YOU have already commented on an issue (to avoid duplicate comments)
    - You want to read the discussion on an issue before responding
    
    IMPORTANT: ALWAYS use this tool to check for existing comments before creating a new comment on an issue. This helps prevent duplicate comments and ensures you're responding to the latest information.`,
    schema: z.object({
      issue_number: z.number().describe('The number of the issue to list comments for'),
    }),
    func: async ({ issue_number }) => {
      try {
        logger.info('Listing GitHub comments:', { issue_number });
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
  createComment: (
    params: CreateCommentParams,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['issues']['createComment']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_comment',
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
export const createCreateReactionForIssueTool = (
  createReaction: (
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
      content: z
        .enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
        .describe('The type of reaction to add'),
      issue_number: z
        .number()
        .describe('The number of the issue to react to. Required if not reacting to a comment'),
    }),
    func: async ({ content, issue_number }) => {
      try {
        logger.info('Creating GitHub reaction:', { content, issue_number });
        const reaction = await createReaction(issue_number, content);
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
export const createListMentionsTool = (
  listMentions: () => Promise<
    GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
  >,
) =>
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
  listNotifications: (
    all?: boolean,
  ) => Promise<
    GithubResponse<
      RestEndpointMethodTypes['activity']['listNotificationsForAuthenticatedUser']['response']['data']
    >
  >,
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
    name: 'list_github_pr_comments',
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
  createPRComment: (
    params: CreatePRCommentParams,
  ) => Promise<
    GithubResponse<
      | RestEndpointMethodTypes['issues']['createComment']['response']['data']
      | RestEndpointMethodTypes['pulls']['createReviewComment']['response']['data']
    >
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pr_comment',
    description: `Create a new comment on a GitHub pull request in the configured repository.
    USE THIS WHEN:
    - You need to provide feedback on a pull request
    - You want to suggest changes to code in a pull request
    - You need to ask questions about a pull request
    
    IMPORTANT: Before creating a new comment, ALWAYS follow these steps:
    1. Use list_github_pr_comments to get all comments on the pull request
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
export const createCreateReactionForPullRequestTool = (
  createPullRequestReaction: (
    pull_number: number,
    content: GitHubReactionType,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'create_github_pr_reaction',
    description: `Create a reaction on a GitHub pull request.
    USE THIS WHEN:
    - You want to add an emoji reaction to a PR
    - You need to express sentiment or feedback on a PR through reactions
    
    IMPORTANT: Before adding a reaction, consider whether you've already reacted to this PR comment. Avoid adding multiple reactions to the same content. Remember that you can only add each reaction type once per comment.
    
    Suggested behavior:
    - Don't leave reactions to your own comments
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
        const reaction = await createPullRequestReaction(pull_number, content);
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
  subscribeToRepo: (
    owner: string,
    repo: string,
    ignored?: boolean,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['activity']['setRepoSubscription']['response']['data']>
  >,
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
        await subscribeToRepo(owner, repo, ignored);
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
  unsubscribeFromRepo: (
    owner: string,
    repo: string,
  ) => Promise<
    GithubResponse<
      RestEndpointMethodTypes['activity']['deleteRepoSubscription']['response']['data']
    >
  >,
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
        await unsubscribeFromRepo(owner, repo);
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
export const createListWatchedReposTool = (
  listSubscriptions: () => Promise<
    GithubResponse<
      RestEndpointMethodTypes['activity']['listReposStarredByAuthenticatedUser']['response']['data']
    >
  >,
) =>
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
        const repos = await listSubscriptions();
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

/**
 * Creates a tool to search GitHub issues
 */
export const createSearchIssuesTools = (
  searchIssues: (
    query: string,
    state: GitHubIssueAndPRState,
  ) => Promise<
    GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'search_github_issues',
    description: `Search for GitHub issues in the configured repository by keywords.
    USE THIS WHEN:
    - You need to find issues related to specific topics or keywords
    - You want to check if an issue already exists before creating a new one
    - You need to find issues with specific words in the title or body
    
    IMPORTANT: Always use this tool to search for existing issues before creating a new issue.
    This is more effective than just listing all issues, as it allows you to find issues by keywords.
    Search for keywords related to the issue you're considering creating.`,
    schema: z.object({
      query: z.string().describe('Keywords to search for in issue titles and bodies'),
      state: z
        .enum(['open', 'closed', 'all'])
        .describe('Filter issues by state. Default is "open".'),
    }),
    func: async ({ query, state = 'open' }) => {
      try {
        logger.info('Searching GitHub issues:', { query, state });
        const issues = await searchIssues(query, state);
        return {
          success: true,
          issues,
        };
      } catch (error) {
        logger.error('Error searching GitHub issues:', error);
        throw error;
      }
    },
  });

/**
 * Creates a tool to get the authenticated GitHub user's information
 */
export const createGetAuthenticatedUserTool = (
  getAuthenticatedUser: () => Promise<
    GithubResponse<RestEndpointMethodTypes['users']['getAuthenticated']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'get_github_authenticated_user',
    description: `Get information about the authenticated GitHub user (yourself).
    USE THIS WHEN:
    - You need to know your GitHub username
    - You need to check if a comment was made by you
    - You need to identify yourself in GitHub interactions
    
    IMPORTANT: Use this tool to get your username before checking comments or issues,
    so you can identify which comments were made by you and avoid duplicate comments.`,
    schema: z.object({}),
    func: async () => {
      try {
        logger.info('Getting authenticated GitHub user');
        const user = await getAuthenticatedUser();
        return {
          success: true,
          user,
        };
      } catch (error) {
        logger.error('Error getting authenticated GitHub user:', error);
        throw error;
      }
    },
  });

export const createListAuthenticatedUserReposTool = (
  listAuthenticatedUserRepos: () => Promise<
    GithubResponse<RestEndpointMethodTypes['repos']['listForAuthenticatedUser']['response']['data']>
  >,
) =>
  new DynamicStructuredTool({
    name: 'list_authenticated_user_repos',
    description: 'Lists repositories owned by the authenticated user',
    schema: z.object({}),
    func: async () => {
      try {
        const repos = await listAuthenticatedUserRepos();
        return JSON.stringify(repos, null, 2);
      } catch (error) {
        logger.error('Error listing authenticated user repositories:', error);
        throw error;
      }
    },
  });

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
        const branch = await createBranch(owner, repo, branchName, sourceBranch);
        return JSON.stringify(branch, null, 2);
      } catch (error) {
        logger.error(
          `Error creating branch ${branchName} from ${sourceBranch} in repository ${owner}/${repo}:`,
          error,
        );
        throw error;
      }
    },
  });

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
        const commit = await createCommit(owner, repo, {
          branch,
          message,
          changes,
        });
        return JSON.stringify(commit, null, 2);
      } catch (error) {
        logger.error(`Error creating commit in repository ${owner}/${repo}:`, error);
        throw error;
      }
    },
  });

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
        const pullRequest = await createPullRequest(params);
        return JSON.stringify(pullRequest, null, 2);
      } catch (error) {
        logger.error(`Error creating pull request:`, error);
        throw error;
      }
    },
  });

export const createGitHubTools = async (token: string, owner: string, repo: string) => {
  const github = await githubClient(token, owner, repo);
  const listIssues = (state: GitHubIssueAndPRState) => github.listIssues(state);
  const createIssue = (params: CreateIssueParams) => github.createIssue(params);
  const listComments = (issue_number: number) => github.listIssueComments(issue_number);
  const createComment = (params: CreateCommentParams) => github.createIssueComment(params);
  const createReaction = (issue_number: number, content: GitHubReactionType) =>
    github.createIssueReaction(issue_number, content);
  const listMentions = () => github.listMentions();
  const listNotifications = (all?: boolean) => github.listNotifications(all);
  const listPullRequests = (state: GitHubIssueAndPRState) => github.listPullRequests(state);
  const getPullRequest = (pull_number: number) => github.getPullRequest(pull_number);
  const listPRComments = (pull_number: number) => github.listPullRequestComments(pull_number);
  const createPRComment = (params: CreatePRCommentParams) =>
    github.createPullRequestComment(params);
  const createPullRequestReaction = (pull_number: number, content: GitHubReactionType) =>
    github.createPullRequestReaction(pull_number, content);
  const watchRepo = (targetOwner: string, targetRepo: string, ignored?: boolean) =>
    github.subscribeToRepo(targetOwner, targetRepo, ignored);
  const unwatchRepo = (targetOwner: string, targetRepo: string) =>
    github.unsubscribeFromRepo(targetOwner, targetRepo);
  const listWatchedRepos = () => github.listSubscriptions();
  const searchIssues = (query: string, state: GitHubIssueAndPRState) =>
    github.searchIssues(query, state);
  const getAuthenticatedUser = () => github.getAuthenticatedUser();
  const listAuthenticatedUserRepos = () => github.listAuthenticatedUserRepos();
  const listUserRepos = (username: string) => github.listUserRepos(username);
  const listOrgRepos = (org: string) => github.listOrgRepos(org);
  const listForks = (targetOwner: string, targetRepo: string) =>
    github.listForks(targetOwner, targetRepo);
  const createFork = (targetOwner: string, targetRepo: string) =>
    github.createFork(targetOwner, targetRepo);
  const getDefaultBranch = (targetOwner: string, targetRepo: string) =>
    github.getDefaultBranch(targetOwner, targetRepo);
  const createBranch = (
    targetOwner: string,
    targetRepo: string,
    branchName: string,
    sourceBranch: string,
  ) => github.createBranch(targetOwner, targetRepo, branchName, sourceBranch);
  const createCommitFn = (targetOwner: string, targetRepo: string, params: CreateCommitParams) =>
    github.createCommit(targetOwner, targetRepo, params);
  const createPullRequestFn = (params: CreatePullRequestParams) => github.createPullRequest(params);

  return [
    createListIssuesTools(listIssues),
    createCreateIssueTool(createIssue),
    createListCommentsTools(listComments),
    createCreateCommentTool(createComment),
    createCreateReactionForIssueTool(createReaction),
    createListMentionsTool(listMentions),
    createListNotificationsTool(listNotifications),
    createListPullRequestsTool(listPullRequests),
    createGetPullRequestTool(getPullRequest),
    createListPRCommentsTool(listPRComments),
    createCreatePRCommentTool(createPRComment),
    createCreateReactionForPullRequestTool(createPullRequestReaction),
    createWatchRepoTool(watchRepo),
    createUnwatchRepoTool(unwatchRepo),
    createListWatchedReposTool(listWatchedRepos),
    createSearchIssuesTools(searchIssues),
    createGetAuthenticatedUserTool(getAuthenticatedUser),
    createListAuthenticatedUserReposTool(listAuthenticatedUserRepos),
    createListUserReposTool(listUserRepos),
    createListOrgReposTool(listOrgRepos),
    createListForksTool(listForks),
    createForkRepoTool(createFork),
    createGetDefaultBranchTool(getDefaultBranch),
    createCreateBranchTool(createBranch),
    createCommitTool(createCommitFn),
    createCreatePullRequestTool(createPullRequestFn),
  ];
};
