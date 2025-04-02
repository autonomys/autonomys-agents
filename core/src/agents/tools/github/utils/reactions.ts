import { RestEndpointMethodTypes } from '@octokit/rest';
import { GithubClient, GitHubReactionType, GithubResponse } from './types.js';

export const listForIssue = async (
  client: GithubClient,
  owner: string,
  repo: string,
  issue_number: number,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['listForIssue']['response']['data']>
> => {
  const response = await client.reactions.listForIssue({
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
  client: GithubClient,
  owner: string,
  repo: string,
  comment_id: number,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['listForIssueComment']['response']['data']>
> => {
  const response = await client.reactions.listForIssueComment({
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
  client: GithubClient,
  owner: string,
  repo: string,
  pull_number: number,
  comment_id: number,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['reactions']['listForPullRequestReviewComment']['response']['data']
  >
> => {
  const response = await client.reactions.listForPullRequestReviewComment({
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
  client: GithubClient,
  owner: string,
  repo: string,
  issue_number: number,
  content: GitHubReactionType,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['createForIssue']['response']['data']>
> => {
  const response = await client.reactions.createForIssue({
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
  client: GithubClient,
  owner: string,
  repo: string,
  comment_id: number,
  content: GitHubReactionType,
): Promise<
  GithubResponse<RestEndpointMethodTypes['reactions']['createForIssueComment']['response']['data']>
> => {
  const response = await client.reactions.createForIssueComment({
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
  client: GithubClient,
  owner: string,
  repo: string,
  pull_number: number,
  comment_id: number,
  content: GitHubReactionType,
): Promise<
  GithubResponse<
    RestEndpointMethodTypes['reactions']['createForPullRequestReviewComment']['response']['data']
  >
> => {
  const response = await client.reactions.createForPullRequestReviewComment({
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
