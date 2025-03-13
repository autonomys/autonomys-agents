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
  GithubClientWithOptions,
  GitHubIssueAndPRState,
  GitHubReactionType,
} from './types.js';
import * as Users from './users.js';

export const githubClient = async (token: string, owner: string, repo: string) => {
  const githubClient = new Octokit({ auth: token }) as GithubClient;

  const client: GithubClientWithOptions = {
    githubClient,
    owner,
    repo,
  };

  // Activity
  const getFeed = async () => Activity.getFeed(client);
  const listNotifications = async (all: boolean = false) => Activity.listNotifications(client, all);
  const subscribeToRepo = async (
    targetOwner: string,
    targetRepo: string,
    ignored: boolean = false,
  ) => Activity.subscribeToRepo(client, targetOwner, targetRepo, ignored);
  const unsubscribeFromRepo = async (targetOwner: string, targetRepo: string) =>
    Activity.unsubscribeFromRepo(client, targetOwner, targetRepo);
  const listSubscriptions = async () => Activity.listSubscriptions(client);
  const listMentions = async () => Activity.listMentions(client);

  // Issues
  const listIssues = async (state: GitHubIssueAndPRState) => Issues.list(client, state);
  const searchIssues = async (query: string, state: GitHubIssueAndPRState) =>
    Issues.search(client, query, state);
  const getIssue = async (issue_number: number) => Issues.get(client, issue_number);
  const createIssue = async (params: CreateIssueParams) => Issues.create(client, params);
  const listIssueComments = (issue_number: number) => Issues.listComments(client, issue_number);
  const createIssueComment = (params: CreateCommentParams) => Issues.createComment(client, params);

  const listIssueReactions = (issue_number: number) => Reactions.listForIssue(client, issue_number);
  const listIssueCommentReactions = (comment_id: number) =>
    Reactions.listForIssueComment(client, comment_id);
  const createIssueReaction = (issue_number: number, content: GitHubReactionType) =>
    Reactions.createForIssue(client, issue_number, content);
  const createIssueCommentReaction = (comment_id: number, content: GitHubReactionType) =>
    Reactions.createForIssueComment(client, comment_id, content);

  // PRs
  const listPullRequests = async (state: GitHubIssueAndPRState) => PRs.list(client, state);
  const searchPullRequests = async (query: string, state: GitHubIssueAndPRState) =>
    PRs.search(client, query, state);
  const getPullRequest = async (pull_number: number) => PRs.get(client, pull_number);
  const createPullRequest = async (params: CreatePullRequestParams) => PRs.create(client, params);
  const listPullRequestComments = (pull_number: number) => PRs.listComments(client, pull_number);
  const createPullRequestComment = (params: CreatePRCommentParams) =>
    PRs.createComment(client, params);

  const listPullRequestReactions = (pull_number: number) =>
    Reactions.listForIssue(client, pull_number);
  const listPullRequestCommentReactions = (comment_id: number) =>
    Reactions.listForIssueComment(client, comment_id);
  const listPullRequestReviewCommentReactions = (pull_number: number, comment_id: number) =>
    Reactions.listForPullRequestReviewComment(client, pull_number, comment_id);
  const createPullRequestReaction = (pull_number: number, content: GitHubReactionType) =>
    Reactions.createForIssue(client, pull_number, content);
  const createPullRequestCommentReaction = (comment_id: number, content: GitHubReactionType) =>
    Reactions.createForIssueComment(client, comment_id, content);
  const createPullRequestReviewCommentReaction = (
    pull_number: number,
    comment_id: number,
    content: GitHubReactionType,
  ) => Reactions.createForPullRequestReviewComment(client, pull_number, comment_id, content);

  // Users
  const getAuthenticatedUser = async () => Users.getAuthenticatedUser(client);
  const listAuthenticatedUserRepos = async () => Users.listAuthenticatedUserRepos(client);

  // Repos
  const listUserRepos = async (username: string) => Repos.listUserRepos(client, username);
  const listOrgRepos = async (org: string) => Repos.listOrgRepos(client, org);
  const listForks = async (targetOwner: string, targetRepo: string) =>
    Repos.listForks(client, targetOwner, targetRepo);
  const createFork = async (targetOwner: string, targetRepo: string) =>
    Repos.createFork(client, targetOwner, targetRepo);
  const getDefaultBranch = async (targetOwner: string, targetRepo: string) =>
    Repos.getDefaultBranch(client, targetOwner, targetRepo);

  // Git
  const createBranch = async (
    targetOwner: string,
    targetRepo: string,
    branchName: string,
    sourceBranch: string,
  ) => Git.createBranch(client, targetOwner, targetRepo, branchName, sourceBranch);
  const createCommit = async (
    targetOwner: string,
    targetRepo: string,
    params: CreateCommitParams,
  ) => Git.createCommit(client, targetOwner, targetRepo, params);

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
