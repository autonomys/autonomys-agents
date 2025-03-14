import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import {
  CreatePRCommentParams,
  CreatePullRequestParams,
  GithubClient,
  GitHubIssueAndPRState,
  GithubResponse,
} from './types.js';

const logger = createLogger('github-prs');

export const list = async (
  client: GithubClient,
  owner: string,
  repo: string,
  state: GitHubIssueAndPRState = 'open',
): Promise<GithubResponse<RestEndpointMethodTypes['pulls']['list']['response']['data']>> => {
  const response = await client.pulls.list({
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
  state: 'open' | 'closed' | 'all' = 'open',
): Promise<
  GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
> => {
  // Format the search query to include repo and state
  const searchQuery = `repo:${owner}/${repo} is:pr state:${state} ${query}`;

  logger.info('Searching GitHub PRs:', { query: searchQuery });

  const response = await client.search.issuesAndPullRequests({
    q: searchQuery,
    sort: 'updated',
    order: 'desc',
    per_page: 20,
  });

  // Filter only pull requests, keep only issues
  const items = response.data.items.filter(item => item.pull_request);
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
  pull_number: number,
): Promise<GithubResponse<RestEndpointMethodTypes['pulls']['get']['response']['data']>> => {
  const response = await client.pulls.get({
    owner,
    repo,
    pull_number,
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
  params: CreatePullRequestParams,
): Promise<GithubResponse<RestEndpointMethodTypes['pulls']['create']['response']['data']>> => {
  const response = await client.pulls.create({
    owner,
    repo,
    title: params.title,
    body: params.body,
    head: params.head,
    base: params.base,
    draft: params.draft,
    maintainer_can_modify: params.maintainer_can_modify,
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
  pull_number: number,
): Promise<
  GithubResponse<
    (
      | RestEndpointMethodTypes['issues']['listComments']['response']['data'][number]
      | RestEndpointMethodTypes['pulls']['listReviewComments']['response']['data'][number]
    )[]
  >
> => {
  const generalCommentsResponse = await client.issues.listComments({
    owner,
    repo,
    issue_number: pull_number,
  });
  const reviewCommentsResponse = await client.pulls.listReviewComments({
    owner,
    repo,
    pull_number,
  });

  const comments = [...generalCommentsResponse.data, ...reviewCommentsResponse.data];
  const sortedComments = comments.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return {
    success: true,
    data: sortedComments,
  };
};

export const createComment = async (
  client: GithubClient,
  owner: string,
  repo: string,
  params: CreatePRCommentParams,
): Promise<
  GithubResponse<
    | RestEndpointMethodTypes['issues']['createComment']['response']['data']
    | RestEndpointMethodTypes['pulls']['createReviewComment']['response']['data']
  >
> => {
  if (params.path && params.line) {
    // Create a review comment on a specific line
    const response = await client.pulls.createReviewComment({
      owner,
      repo,
      pull_number: params.pull_number,
      body: params.body,
      commit_id: params.commit_id || '',
      path: params.path,
      line: params.line,
      side: params.side || 'RIGHT',
    });
    return {
      success: true,
      data: response.data,
    };
  } else {
    // Create a regular PR comment
    const response = await client.issues.createComment({
      owner,
      repo,
      issue_number: params.pull_number,
      body: params.body,
    });
    return {
      success: true,
      data: response.data,
    };
  }
};
