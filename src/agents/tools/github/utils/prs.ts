import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import {
  CreatePRCommentParams,
  CreatePullRequestParams,
  GithubClientWithOptions,
  GitHubIssueAndPRState,
  GithubResponse,
} from './types.js';

const logger = createLogger('github-prs');

export const list = async (
  client: GithubClientWithOptions,
  state: GitHubIssueAndPRState = 'open',
): Promise<GithubResponse<RestEndpointMethodTypes['pulls']['list']['response']['data']>> => {
  const { githubClient, owner, repo } = client;
  try {
    const response = await githubClient.pulls.list({
      owner,
      repo,
      state,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error listing GitHub PRs:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const search = async (
  client: GithubClientWithOptions,
  query: string,
  state: 'open' | 'closed' | 'all' = 'open',
): Promise<
  GithubResponse<RestEndpointMethodTypes['search']['issuesAndPullRequests']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  try {
    // Format the search query to include repo and state
    const searchQuery = `repo:${owner}/${repo} is:pr state:${state} ${query}`;

    logger.info('Searching GitHub PRs:', { query: searchQuery });

    const response = await githubClient.search.issuesAndPullRequests({
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
  } catch (error) {
    logger.error('Error searching GitHub PRs:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const get = async (
  client: GithubClientWithOptions,
  pull_number: number,
): Promise<GithubResponse<RestEndpointMethodTypes['pulls']['get']['response']['data']>> => {
  const { githubClient, owner, repo } = client;
  try {
    const response = await githubClient.pulls.get({
      owner,
      repo,
      pull_number,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error getting GitHub PR:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const create = async (
  client: GithubClientWithOptions,
  params: CreatePullRequestParams,
): Promise<GithubResponse<RestEndpointMethodTypes['pulls']['create']['response']['data']>> => {
  const { githubClient, owner, repo } = client;
  try {
    const response = await githubClient.pulls.create({
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
  } catch (error) {
    logger.error('Error creating GitHub PR:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const listComments = async (
  client: GithubClientWithOptions,
  pull_number: number,
): Promise<
  GithubResponse<
    (
      | RestEndpointMethodTypes['issues']['listComments']['response']['data'][number]
      | RestEndpointMethodTypes['pulls']['listReviewComments']['response']['data'][number]
    )[]
  >
> => {
  const { githubClient, owner, repo } = client;
  try {
    const generalCommentsResponse = await githubClient.issues.listComments({
      owner,
      repo,
      issue_number: pull_number,
    });
    const reviewCommentsResponse = await githubClient.pulls.listReviewComments({
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
  } catch (error) {
    logger.error('Error listing GitHub issue comments:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const createComment = async (
  client: GithubClientWithOptions,
  params: CreatePRCommentParams,
): Promise<
  GithubResponse<
    | RestEndpointMethodTypes['issues']['createComment']['response']['data']
    | RestEndpointMethodTypes['pulls']['createReviewComment']['response']['data']
  >
> => {
  const { githubClient, owner, repo } = client;
  try {
    if (params.path && params.line) {
      // Create a review comment on a specific line
      const response = await githubClient.pulls.createReviewComment({
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
      const response = await githubClient.issues.createComment({
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
  } catch (error) {
    logger.error('Error creating GitHub PR comment:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};
