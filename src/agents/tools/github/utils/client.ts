import { Octokit } from '@octokit/rest';
import * as Activity from './activity.js';
import * as Git from './git.js';
import * as Issues from './issues.js';
import * as PRs from './prs.js';
import * as Reactions from './reactions.js';
import * as Repos from './repos.js';
import {
  CreateCommentParams,
  CreateCommitParams,
  CreateIssueParams,
  CreatePRCommentParams,
  CreatePullRequestParams,
  GithubClient,
  GitHubIssueAndPRState,
  GitHubReactionType,
} from './types.js';
import * as Users from './users.js';

export const githubClient = async (token: string) => {
  const client = new Octokit({ auth: token }) as GithubClient;

  // Activity
  const getFeed = async () => Activity.getFeed(client);
  const listNotifications = async (all: boolean = false) => Activity.listNotifications(client, all);
  const subscribeToRepo = async (owner: string, repo: string, ignored: boolean = false) =>
    Activity.subscribeToRepo(client, owner, repo, ignored);
  const unsubscribeFromRepo = async (owner: string, repo: string) =>
    Activity.unsubscribeFromRepo(client, owner, repo);
  const listSubscriptions = async () => Activity.listSubscriptions(client);
  const listMentions = async () => Activity.listMentions(client);

  // Issues
  const listIssues = async (owner: string, repo: string, state: GitHubIssueAndPRState) =>
    Issues.list(client, owner, repo, state);
  const searchIssues = async (
    owner: string,
    repo: string,
    query: string,
    state: GitHubIssueAndPRState,
  ) => Issues.search(client, owner, repo, query, state);
  const getIssue = async (owner: string, repo: string, issue_number: number) =>
    Issues.get(client, owner, repo, issue_number);
  const createIssue = async (owner: string, repo: string, params: CreateIssueParams) =>
    Issues.create(client, owner, repo, params);
  const listIssueComments = async (owner: string, repo: string, issue_number: number) =>
    Issues.listComments(client, owner, repo, issue_number);
  const createIssueComment = async (owner: string, repo: string, params: CreateCommentParams) =>
    Issues.createComment(client, owner, repo, params);

  const listIssueReactions = async (owner: string, repo: string, issue_number: number) =>
    Reactions.listForIssue(client, owner, repo, issue_number);
  const listIssueCommentReactions = async (owner: string, repo: string, comment_id: number) =>
    Reactions.listForIssueComment(client, owner, repo, comment_id);
  const createIssueReaction = async (
    owner: string,
    repo: string,
    issue_number: number,
    content: GitHubReactionType,
  ) => Reactions.createForIssue(client, owner, repo, issue_number, content);
  const createIssueCommentReaction = async (
    owner: string,
    repo: string,
    comment_id: number,
    content: GitHubReactionType,
  ) => Reactions.createForIssueComment(client, owner, repo, comment_id, content);

  // PRs
  const listPullRequests = async (owner: string, repo: string, state: GitHubIssueAndPRState) =>
    PRs.list(client, owner, repo, state);
  const searchPullRequests = async (
    owner: string,
    repo: string,
    query: string,
    state: GitHubIssueAndPRState,
  ) => PRs.search(client, owner, repo, query, state);
  const getPullRequest = async (owner: string, repo: string, pull_number: number) =>
    PRs.get(client, owner, repo, pull_number);
  const createPullRequest = async (owner: string, repo: string, params: CreatePullRequestParams) =>
    PRs.create(client, owner, repo, params);
  const listPullRequestComments = async (owner: string, repo: string, pull_number: number) =>
    PRs.listComments(client, owner, repo, pull_number);
  const createPullRequestComment = async (
    owner: string,
    repo: string,
    params: CreatePRCommentParams,
  ) => PRs.createComment(client, owner, repo, params);

  const listPullRequestReactions = async (owner: string, repo: string, pull_number: number) =>
    Reactions.listForIssue(client, owner, repo, pull_number);
  const listPullRequestCommentReactions = async (owner: string, repo: string, comment_id: number) =>
    Reactions.listForIssueComment(client, owner, repo, comment_id);
  const listPullRequestReviewCommentReactions = async (
    owner: string,
    repo: string,
    pull_number: number,
    comment_id: number,
  ) => Reactions.listForPullRequestReviewComment(client, owner, repo, pull_number, comment_id);
  const createPullRequestReaction = async (
    owner: string,
    repo: string,
    pull_number: number,
    content: GitHubReactionType,
  ) => Reactions.createForIssue(client, owner, repo, pull_number, content);
  const createPullRequestCommentReaction = async (
    owner: string,
    repo: string,
    comment_id: number,
    content: GitHubReactionType,
  ) => Reactions.createForIssueComment(client, owner, repo, comment_id, content);
  const createPullRequestReviewCommentReaction = async (
    owner: string,
    repo: string,
    pull_number: number,
    comment_id: number,
    content: GitHubReactionType,
  ) =>
    Reactions.createForPullRequestReviewComment(
      client,
      owner,
      repo,
      pull_number,
      comment_id,
      content,
    );

  // Users
  const getAuthenticatedUser = async () => Users.getAuthenticatedUser(client);
  const listAuthenticatedUserRepos = async () => Users.listAuthenticatedUserRepos(client);

  // Repos
  const listUserRepos = async (username: string) => Repos.listUserRepos(client, username);
  const listOrgRepos = async (org: string) => Repos.listOrgRepos(client, org);
  const listForks = async (owner: string, repo: string) => Repos.listForks(client, owner, repo);
  const createFork = async (owner: string, repo: string) => Repos.createFork(client, owner, repo);
  const getDefaultBranch = async (owner: string, repo: string) =>
    Repos.getDefaultBranch(client, owner, repo);

  // Git
  const createBranch = async (
    owner: string,
    repo: string,
    branchName: string,
    sourceBranch: string,
  ) => Git.createBranch(client, owner, repo, branchName, sourceBranch);
  const createCommit = async (owner: string, repo: string, params: CreateCommitParams) =>
    Git.createCommit(client, owner, repo, params);

  return {
    getFeed,
    listNotifications,
    subscribeToRepo,
    unsubscribeFromRepo,
    listSubscriptions,
    listMentions,

    listIssues,
    searchIssues,
    getIssue,
    createIssue,
    listIssueComments,
    createIssueComment,
    listIssueReactions,
    listIssueCommentReactions,
    createIssueReaction,
    createIssueCommentReaction,

    listPullRequests,
    searchPullRequests,
    getPullRequest,
    createPullRequest,
    listPullRequestComments,
    createPullRequestComment,
    listPullRequestReactions,
    listPullRequestCommentReactions,
    listPullRequestReviewCommentReactions,
    createPullRequestReaction,
    createPullRequestCommentReaction,
    createPullRequestReviewCommentReaction,

    getAuthenticatedUser,
    listAuthenticatedUserRepos,

    listUserRepos,
    listOrgRepos,
    listForks,
    createFork,

    getDefaultBranch,
    createBranch,
    createCommit,
  };
};
