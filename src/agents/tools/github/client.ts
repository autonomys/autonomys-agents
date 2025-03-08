import { Octokit } from '@octokit/rest';
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

export interface CreateIssueParams {
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
}

export interface GitHubClient {
  listIssues: (state?: 'open' | 'closed' | 'all') => Promise<IssueInfo[]>;
  createIssue: (params: CreateIssueParams) => Promise<IssueInfo>;
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

      return response.data.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        body: issue.body || undefined,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        html_url: issue.html_url,
      }));
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

  return {
    listIssues,
    createIssue,
  };
};
