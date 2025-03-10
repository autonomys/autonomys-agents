import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('github-client');

export interface IssueInfo {
  number: number;
  title: string;
  state: string;
  body?: string;
  created_at: string;
  updated_at: string;
  html_url: string;
  user: {
    login: string;
  };
}

export interface CommentInfo {
  id: number;
  body: string;
  user: {
    login: string;
  };
  created_at: string;
  updated_at: string;
  html_url: string;
}

export type ReactionType =
  | '+1'
  | '-1'
  | 'laugh'
  | 'confused'
  | 'heart'
  | 'hooray'
  | 'rocket'
  | 'eyes';

export interface ReactionInfo {
  id: number;
  content: ReactionType;
  user: {
    login: string;
  };
  created_at: string;
}

export interface CreateReactionParams {
  content: ReactionType;
  issue_number?: number;
  comment_id?: number;
}

export interface CreateIssueParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface CreateCommentParams {
  issue_number: number;
  body: string;
}

export interface NotificationInfo {
  id: string;
  unread: boolean;
  reason: string;
  subject: {
    title: string;
    type: string;
    url: string;
  };
  repository: {
    full_name: string;
  };
  updated_at: string;
  url: string;
  html_url?: string;
}

export interface MentionInfo {
  number: number;
  title: string;
  body: string;
  html_url: string;
  repository: {
    full_name: string;
  };
  created_at: string;
  updated_at: string;
  type: 'issue' | 'pull_request';
}

export interface PullRequestInfo {
  number: number;
  title: string;
  state: string;
  body?: string;
  html_url: string;
  created_at: string;
  updated_at: string;
  user: {
    login: string;
  };
  assignees: {
    login: string;
  }[];
  requested_reviewers: {
    login: string;
  }[];
}

export interface CreatePRCommentParams {
  pull_number: number;
  body: string;
  commit_id?: string;
  path?: string;
  line?: number;
  side?: 'LEFT' | 'RIGHT';
}

export interface PRCommentInfo extends CommentInfo {
  position?: number;
  path?: string;
  commit_id?: string;
  is_review_comment?: boolean;
}

export interface WatchedRepoInfo {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  updated_at: string;
  pushed_at: string;
  subscription: {
    subscribed: boolean;
    ignored: boolean;
  };
}

export interface UserInfo {
  login: string;
  name?: string;
  avatar_url?: string;
  html_url: string;
}

export interface GitHubClient {
  listIssues: (state?: 'open' | 'closed' | 'all') => Promise<IssueInfo[]>;
  createIssue: (params: CreateIssueParams) => Promise<IssueInfo>;
  listComments: (issue_number: number) => Promise<CommentInfo[]>;
  createComment: (params: CreateCommentParams) => Promise<CommentInfo>;
  createReaction: (params: CreateReactionParams) => Promise<ReactionInfo>;
  listMentions: () => Promise<MentionInfo[]>;
  listNotifications: (all?: boolean) => Promise<NotificationInfo[]>;
  listPullRequests: (state?: 'open' | 'closed' | 'all') => Promise<PullRequestInfo[]>;
  getPullRequest: (pull_number: number) => Promise<PullRequestInfo>;
  listPRComments: (pull_number: number) => Promise<PRCommentInfo[]>;
  createPRComment: (params: CreatePRCommentParams) => Promise<PRCommentInfo>;
  createPRReaction: (
    params: CreateReactionParams & { pull_number: number },
  ) => Promise<ReactionInfo>;
  watchRepo: (owner: string, repo: string, ignored?: boolean) => Promise<void>;
  unwatchRepo: (owner: string, repo: string) => Promise<void>;
  listWatchedRepos: () => Promise<WatchedRepoInfo[]>;
  searchIssues: (query: string, state?: 'open' | 'closed' | 'all') => Promise<IssueInfo[]>;
  getAuthenticatedUser: () => Promise<UserInfo>;
}

export const githubClient = async (
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubClient> => {
  const octokit = new Octokit({
    auth: token,
  });

  const listIssues = async (state: 'open' | 'closed' | 'all' = 'open'): Promise<IssueInfo[]> => {
    try {
      const response = await octokit.issues.listForRepo({
        owner,
        repo,
        state,
      });

      return response.data.map(
        (issue: RestEndpointMethodTypes['issues']['listForRepo']['response']['data'][number]) => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          body: issue.body || undefined,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          html_url: issue.html_url,
          user: {
            login: issue.user?.login || 'unknown',
          },
        }),
      );
    } catch (error) {
      logger.error('Error listing GitHub issues:', error);
      throw error;
    }
  };

  const createIssue = async (params: CreateIssueParams): Promise<IssueInfo> => {
    try {
      const response = await octokit.issues.create({
        owner,
        repo,
        title: params.title,
        body: params.body,
        labels: params.labels,
        assignees: params.assignees,
      });

      return {
        number: response.data.number,
        title: response.data.title,
        state: response.data.state,
        body: response.data.body || undefined,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        html_url: response.data.html_url,
        user: {
          login: response.data.user?.login || 'unknown',
        },
      };
    } catch (error) {
      logger.error('Error creating GitHub issue:', error);
      throw error;
    }
  };

  const listComments = async (issue_number: number): Promise<CommentInfo[]> => {
    try {
      const response = await octokit.issues.listComments({
        owner,
        repo,
        issue_number,
      });

      return response.data.map(
        (
          comment: RestEndpointMethodTypes['issues']['listComments']['response']['data'][number],
        ) => ({
          id: comment.id,
          body: comment.body || '',
          user: {
            login: comment.user?.login || 'unknown',
          },
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          html_url: comment.html_url,
        }),
      );
    } catch (error) {
      logger.error('Error listing issue comments:', error);
      throw error;
    }
  };

  const createComment = async (params: CreateCommentParams): Promise<CommentInfo> => {
    try {
      const response = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: params.issue_number,
        body: params.body,
      });

      return {
        id: response.data.id,
        body: response.data.body || '',
        user: {
          login: response.data.user?.login || 'unknown',
        },
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        html_url: response.data.html_url,
      };
    } catch (error) {
      logger.error('Error creating issue comment:', error);
      throw error;
    }
  };

  const createReaction = async (params: CreateReactionParams): Promise<ReactionInfo> => {
    try {
      let response;

      if (params.issue_number) {
        // Create reaction for an issue
        response = await octokit.reactions.createForIssue({
          owner,
          repo,
          issue_number: params.issue_number,
          content: params.content,
        });
      } else if (params.comment_id) {
        // Create reaction for a comment
        response = await octokit.reactions.createForIssueComment({
          owner,
          repo,
          comment_id: params.comment_id,
          content: params.content,
        });
      } else {
        throw new Error('Either issue_number or comment_id must be provided');
      }

      return {
        id: response.data.id,
        content: response.data.content as ReactionType,
        user: {
          login: response.data.user?.login || 'unknown',
        },
        created_at: response.data.created_at,
      };
    } catch (error) {
      logger.error('Error creating reaction:', error);
      throw error;
    }
  };

  const listMentions = async (): Promise<MentionInfo[]> => {
    try {
      // Search for issues and PRs where the authenticated user is mentioned
      const response = await octokit.search.issuesAndPullRequests({
        q: `mentions:${(await octokit.users.getAuthenticated()).data.login}`,
        sort: 'updated',
        order: 'desc',
      });

      return response.data.items.map(item => ({
        number: item.number,
        title: item.title,
        body: item.body || '',
        html_url: item.html_url,
        repository: {
          full_name: item.repository_url.split('/repos/')[1],
        },
        created_at: item.created_at,
        updated_at: item.updated_at,
        type: item.pull_request ? 'pull_request' : 'issue',
      }));
    } catch (error) {
      logger.error('Error listing mentions:', error);
      throw error;
    }
  };

  const listNotifications = async (all: boolean = false): Promise<NotificationInfo[]> => {
    try {
      const response = await octokit.activity.listNotificationsForAuthenticatedUser({
        all, // if true, show all notifications, if false, show only unread
      });

      return response.data.map(notification => ({
        id: notification.id,
        unread: notification.unread,
        reason: notification.reason,
        subject: {
          title: notification.subject.title,
          type: notification.subject.type,
          url: notification.subject.url,
        },
        repository: {
          full_name: notification.repository.full_name,
        },
        updated_at: notification.updated_at,
        url: notification.url,
        html_url: notification.subject.url
          ?.replace('api.github.com/repos', 'github.com')
          .replace('/pulls/', '/pull/')
          .replace('/issues/', '/issue/'),
      }));
    } catch (error) {
      logger.error('Error listing notifications:', error);
      throw error;
    }
  };

  const listPullRequests = async (
    state: 'open' | 'closed' | 'all' = 'open',
  ): Promise<PullRequestInfo[]> => {
    try {
      const response = await octokit.pulls.list({
        owner,
        repo,
        state,
      });

      return response.data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        body: pr.body || undefined,
        html_url: pr.html_url,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        user: {
          login: pr.user?.login || 'unknown',
        },
        assignees: pr.assignees?.map(assignee => ({ login: assignee.login })) || [],
        requested_reviewers:
          pr.requested_reviewers?.map(reviewer => ({ login: reviewer.login })) || [],
      }));
    } catch (error) {
      logger.error('Error listing pull requests:', error);
      throw error;
    }
  };

  const getPullRequest = async (pull_number: number): Promise<PullRequestInfo> => {
    try {
      const response = await octokit.pulls.get({
        owner,
        repo,
        pull_number,
      });

      return {
        number: response.data.number,
        title: response.data.title,
        state: response.data.state,
        body: response.data.body || undefined,
        html_url: response.data.html_url,
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        user: {
          login: response.data.user?.login || 'unknown',
        },
        assignees: response.data.assignees?.map(assignee => ({ login: assignee.login })) || [],
        requested_reviewers:
          response.data.requested_reviewers?.map(reviewer => ({ login: reviewer.login })) || [],
      };
    } catch (error) {
      logger.error('Error getting pull request:', error);
      throw error;
    }
  };

  const listPRComments = async (pull_number: number): Promise<PRCommentInfo[]> => {
    try {
      // Get review comments (comments on specific lines of code)
      const reviewCommentsResponse = await octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number,
      });

      // Get general comments on the PR
      const generalCommentsResponse = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: pull_number, // For general comments, use issue_number (same as pull_number)
      });

      // Process review comments
      const reviewComments = reviewCommentsResponse.data.map(comment => ({
        id: comment.id,
        body: comment.body || '',
        user: {
          login: comment.user?.login || 'unknown',
        },
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        html_url: comment.html_url,
        position: comment.position || undefined,
        path: comment.path,
        commit_id: comment.commit_id,
        is_review_comment: true,
      }));

      // Process general comments
      const generalComments = generalCommentsResponse.data.map(comment => ({
        id: comment.id,
        body: comment.body || '',
        user: {
          login: comment.user?.login || 'unknown',
        },
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        html_url: comment.html_url,
        is_review_comment: false,
      }));

      // Combine both types of comments and sort by creation date (newest first)
      const allComments = [...reviewComments, ...generalComments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      logger.info('Listed PR comments:', {
        pull_number,
        reviewCommentsCount: reviewComments.length,
        generalCommentsCount: generalComments.length,
        totalCount: allComments.length,
      });

      return allComments;
    } catch (error) {
      logger.error('Error listing PR comments:', error);
      throw error;
    }
  };

  const createPRComment = async (params: CreatePRCommentParams): Promise<PRCommentInfo> => {
    try {
      let response;

      if (params.path && params.line) {
        // Create a review comment on a specific line
        response = await octokit.pulls.createReviewComment({
          owner,
          repo,
          pull_number: params.pull_number,
          body: params.body,
          commit_id: params.commit_id || '',
          path: params.path,
          line: params.line,
          side: params.side || 'RIGHT',
        });
      } else {
        // Create a regular PR comment
        response = await octokit.issues.createComment({
          owner,
          repo,
          issue_number: params.pull_number,
          body: params.body,
        });
      }

      return {
        id: response.data.id,
        body: response.data.body || '',
        user: {
          login: response.data.user?.login || 'unknown',
        },
        created_at: response.data.created_at,
        updated_at: response.data.updated_at,
        html_url: response.data.html_url,
        position: 'position' in response.data ? response.data.position : undefined,
        path: 'path' in response.data ? response.data.path : undefined,
        commit_id: 'commit_id' in response.data ? response.data.commit_id : undefined,
      };
    } catch (error) {
      logger.error('Error creating PR comment:', error);
      throw error;
    }
  };

  const createPRReaction = async (
    params: CreateReactionParams & { pull_number: number },
  ): Promise<ReactionInfo> => {
    try {
      const response = await octokit.reactions.createForPullRequestReviewComment({
        owner,
        repo,
        comment_id: params.comment_id || 0,
        content: params.content,
      });

      return {
        id: response.data.id,
        content: response.data.content as ReactionType,
        user: {
          login: response.data.user?.login || 'unknown',
        },
        created_at: response.data.created_at,
      };
    } catch (error) {
      logger.error('Error creating PR reaction:', error);
      throw error;
    }
  };

  const watchRepo = async (
    targetOwner: string,
    targetRepo: string,
    ignored: boolean = false,
  ): Promise<void> => {
    try {
      // First, set up the watching subscription
      await octokit.activity.setRepoSubscription({
        owner: targetOwner,
        repo: targetRepo,
        subscribed: true,
        ignored: ignored,
      });

      logger.info('Successfully watched repository:', { owner: targetOwner, repo: targetRepo });
    } catch (error) {
      logger.error('Error watching repository:', error);
      throw error;
    }
  };

  const unwatchRepo = async (targetOwner: string, targetRepo: string): Promise<void> => {
    try {
      await octokit.activity.deleteRepoSubscription({
        owner: targetOwner,
        repo: targetRepo,
      });

      logger.info('Successfully unwatched repository:', { owner: targetOwner, repo: targetRepo });
    } catch (error) {
      logger.error('Error un-watching repository:', error);
      throw error;
    }
  };

  const listWatchedRepos = async (): Promise<WatchedRepoInfo[]> => {
    try {
      const response = await octokit.activity.listReposStarredByAuthenticatedUser();
      const watchedRepos = await Promise.all(
        response.data.map(async repo => {
          // Get subscription details for each repo
          const subscription = await octokit.activity
            .getRepoSubscription({
              owner: repo.owner.login,
              repo: repo.name,
            })
            .catch(() => ({ data: { subscribed: true, ignored: false } }));

          return {
            id: repo.id,
            name: repo.name,
            full_name: repo.full_name,
            description: repo.description || undefined,
            html_url: repo.html_url,
            updated_at: repo.updated_at,
            pushed_at: repo.pushed_at,
            subscription: {
              subscribed: subscription.data.subscribed,
              ignored: subscription.data.ignored,
            },
          };
        }),
      );

      return watchedRepos.filter(repo => repo.updated_at !== null) as WatchedRepoInfo[];
    } catch (error) {
      logger.error('Error listing watched repositories:', error);
      throw error;
    }
  };

  const searchIssues = async (
    query: string,
    state: 'open' | 'closed' | 'all' = 'open',
  ): Promise<IssueInfo[]> => {
    try {
      // Format the search query to include repo and state
      const searchQuery = `repo:${owner}/${repo} is:issue state:${state} ${query}`;

      logger.info('Searching GitHub issues:', { query: searchQuery });

      const response = await octokit.search.issuesAndPullRequests({
        q: searchQuery,
        sort: 'updated',
        order: 'desc',
        per_page: 20,
      });

      // Filter out pull requests, keep only issues
      return response.data.items
        .filter(item => !item.pull_request)
        .map(issue => ({
          number: issue.number,
          title: issue.title,
          state: issue.state,
          body: issue.body || undefined,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          html_url: issue.html_url,
          user: {
            login: issue.user?.login || 'unknown',
          },
        }));
    } catch (error) {
      logger.error('Error searching GitHub issues:', error);
      throw error;
    }
  };

  const getAuthenticatedUser = async (): Promise<UserInfo> => {
    try {
      logger.info('Getting authenticated user info');
      const response = await octokit.users.getAuthenticated();

      return {
        login: response.data.login,
        name: response.data.name || undefined,
        avatar_url: response.data.avatar_url || undefined,
        html_url: response.data.html_url,
      };
    } catch (error) {
      logger.error('Error getting authenticated user:', error);
      throw error;
    }
  };

  return {
    listIssues,
    createIssue,
    listComments,
    createComment,
    createReaction,
    listMentions,
    listNotifications,
    listPullRequests,
    getPullRequest,
    listPRComments,
    createPRComment,
    createPRReaction,
    watchRepo,
    unwatchRepo,
    listWatchedRepos,
    searchIssues,
    getAuthenticatedUser,
  };
};
