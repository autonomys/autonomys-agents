import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import {
  CreateCommentParams,
  CreateIssueParams,
  GithubClient,
  GitHubIssueAndPRState,
  GithubResponse,
} from './types.js';

const logger = createLogger('github-issues');

export const list = async (
  client: GithubClient,
  owner: string,
  repo: string,
  state: GitHubIssueAndPRState = 'open',
): Promise<
  GithubResponse<RestEndpointMethodTypes['issues']['listForRepo']['response']['data']>
> => {
  const response = await client.issues.listForRepo({
    owner,
    repo,
    state,
  });

  return {
    success: true,
    data: response.data,
  };
};

export const search = async (
  client: GithubClient,
  owner: string,
  repo: string,
  query: string,
  state: GitHubIssueAndPRState = 'open',
): Promise<
  GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
> => {
  // Format the search query to include repo and state
  const searchQuery = `repo:${owner}/${repo} is:issue state:${state} ${query}`;

  logger.info('Searching GitHub issues:', { query: searchQuery });

  const response = await client.search.issuesAndPullRequests({
    q: searchQuery,
    sort: 'updated',
    order: 'desc',
    per_page: 20,
  });

  // Filter out pull requests, keep only issues
  const items = response.data.items.filter(item => !item.pull_request);
  return {
    success: true,
    data: {
      total_count: items.length,
      incomplete_results: response.data.incomplete_results,
      items,
    },
  };
};

export const get = async (
  client: GithubClient,
  owner: string,
  repo: string,
  issue_number: number,
): Promise<GithubResponse<RestEndpointMethodTypes['issues']['get']['response']['data']>> => {
  const response = await client.issues.get({
    owner,
    repo,
    issue_number,
  });

  return {
    success: true,
    data: response.data,
  };
};

export const create = async (
  client: GithubClient,
  owner: string,
  repo: string,
  params: CreateIssueParams,
): Promise<GithubResponse<RestEndpointMethodTypes['issues']['create']['response']['data']>> => {
  const response = await client.issues.create({
    owner,
    repo,
    title: params.title,
    body: params.body,
    labels: params.labels,
    assignees: params.assignees,
  });

  return {
    success: true,
    data: response.data,
  };
};

export const listComments = async (
  client: GithubClient,
  owner: string,
  repo: string,
  issue_number: number,
): Promise<
  GithubResponse<RestEndpointMethodTypes['issues']['listComments']['response']['data']>
> => {
  const response = await client.issues.listComments({
    owner,
    repo,
    issue_number,
  });

  return {
    success: true,
    data: response.data,
  };
};

export const createComment = async (
  client: GithubClient,
  owner: string,
  repo: string,
  params: CreateCommentParams,
): Promise<
  GithubResponse<RestEndpointMethodTypes['issues']['createComment']['response']['data']>
> => {
  const response = await client.issues.createComment({
    owner,
    repo,
    issue_number: params.issue_number,
    body: params.body,
  });
  return {
    success: true,
    data: response.data,
  };
};
