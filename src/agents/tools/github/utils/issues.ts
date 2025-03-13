import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import {
  CreateCommentParams,
  CreateIssueParams,
  GithubClientWithOptions,
  GitHubIssueAndPRState,
  GithubResponse,
} from './types.js';

const logger = createLogger('github-issues');

export const list = async (
  client: GithubClientWithOptions,
  state: GitHubIssueAndPRState = 'open',
): Promise<
  GithubResponse<RestEndpointMethodTypes['issues']['listForRepo']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.issues.listForRepo({
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
  client: GithubClientWithOptions,
  query: string,
  state: GitHubIssueAndPRState = 'open',
): Promise<
  GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  // Format the search query to include repo and state
  const searchQuery = `repo:${owner}/${repo} is:issue state:${state} ${query}`;

  logger.info('Searching GitHub issues:', { query: searchQuery });

  const response = await githubClient.search.issuesAndPullRequests({
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
  client: GithubClientWithOptions,
  issue_number: number,
): Promise<GithubResponse<RestEndpointMethodTypes['issues']['get']['response']['data']>> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.issues.get({
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
  client: GithubClientWithOptions,
  params: CreateIssueParams,
): Promise<GithubResponse<RestEndpointMethodTypes['issues']['create']['response']['data']>> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.issues.create({
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
  client: GithubClientWithOptions,
  issue_number: number,
): Promise<
  GithubResponse<RestEndpointMethodTypes['issues']['listComments']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.issues.listComments({
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
  client: GithubClientWithOptions,
  params: CreateCommentParams,
): Promise<
  GithubResponse<RestEndpointMethodTypes['issues']['createComment']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.issues.createComment({
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
