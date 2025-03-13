import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClientWithOptions, GitHubReactionType, GithubResponse } from './types.js';

export const listForIssue = async (
  client: GithubClientWithOptions,
  issue_number: number,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['listForIssue']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.reactions.listForIssue({
    owner,
    repo,
    issue_number,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const listForIssueComment = async (
  client: GithubClientWithOptions,
  comment_id: number,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['listForIssueComment']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.reactions.listForIssueComment({
    owner,
    repo,
    comment_id,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const listForPullRequestReviewComment = async (
  client: GithubClientWithOptions,
  pull_number: number,
  comment_id: number,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['reactions']['listForPullRequestReviewComment']['response']['data']
  >
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.reactions.listForPullRequestReviewComment({
    owner,
    repo,
    pull_number,
    comment_id,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const createForIssue = async (
  client: GithubClientWithOptions,
  issue_number: number,
  content: GitHubReactionType,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.reactions.createForIssue({
    owner,
    repo,
    issue_number,
    content,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const createForIssueComment = async (
  client: GithubClientWithOptions,
  comment_id: number,
  content: GitHubReactionType,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['createForIssueComment']['response']['data']>
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.reactions.createForIssueComment({
    owner,
    repo,
    comment_id,
    content,
  });
  return {
    success: true,
    data: response.data,
  };
};

export const createForPullRequestReviewComment = async (
  client: GithubClientWithOptions,
  pull_number: number,
  comment_id: number,
  content: GitHubReactionType,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['reactions']['createForPullRequestReviewComment']['response']['data']
  >
> => {
  const { githubClient, owner, repo } = client;
  const response = await githubClient.reactions.createForPullRequestReviewComment({
    owner,
    repo,
    pull_number,
    comment_id,
    content,
  });
  return {
    success: true,
    data: response.data,
  };
};
