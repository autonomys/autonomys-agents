import { type PaginateInterface } from '@octokit/plugin-paginate-rest';
import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';

export type GithubClient = Octokit &
  RestEndpointMethodTypes & {
    paginate: PaginateInterface;
  };

export type GithubResponse<T> = {
  success: boolean;
  data?: T;
  error?: Error;
};

export type GitHubIssueAndPRState = 'open' | 'closed' | 'all';

export type GitHubPullRequestReviewEvent = 'REQUEST_CHANGES' | 'APPROVE' | 'COMMENT';

export type GitHubReactionType =
  | '+1'
  | '-1'
  | 'laugh'
  | 'confused'
  | 'heart'
  | 'hooray'
  | 'rocket'
  | 'eyes';

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

export interface CreatePRCommentParams {
  pull_number: number;
  body: string;
  commit_id?: string;
  path?: string;
  line?: number;
  side?: 'LEFT' | 'RIGHT';
}

export interface CreateCommitParams {
  branch: string;
  message: string;
  changes: Array<{
    path: string;
    content: string;
  }>;
}

export interface CreatePullRequestParams {
  title: string;
  body?: string;
  head: string;
  base: string;
  draft?: boolean;
  maintainer_can_modify?: boolean;
}
