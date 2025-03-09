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

export interface GitHubClient {
  listIssues: (state?: 'open' | 'closed' | 'all') => Promise<IssueInfo[]>;
  createIssue: (params: CreateIssueParams) => Promise<IssueInfo>;
  listComments: (issue_number: number) => Promise<CommentInfo[]>;
  createComment: (params: CreateCommentParams) => Promise<CommentInfo>;
  createReaction: (params: CreateReactionParams) => Promise<ReactionInfo>;
  listMentions: () => Promise<MentionInfo[]>;
  listNotifications: (all?: boolean) => Promise<NotificationInfo[]>;
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

  return {
    listIssues,
    createIssue,
    listComments,
    createComment,
    createReaction,
    listMentions,
    listNotifications,
  };
};
