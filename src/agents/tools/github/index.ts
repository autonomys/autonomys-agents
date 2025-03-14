import {
  createGetFeedTool,
  createListMentionsTool,
  createListNotificationsTool,
  createListWatchedReposTool,
  createUnwatchRepoTool,
  createWatchRepoTool,
} from './activity.js';
import { createCommitTool, createCreateBranchTool } from './git.js';
import {
  createCreateIssueCommentTool,
  createCreateIssueTool,
  createCreateReactionForIssueCommentTool,
  createCreateReactionForIssueTool,
  createGetIssueTools,
  createListIssueCommentReactionsTools,
  createListIssueCommentsTools,
  createListIssueReactionsTools,
  createListIssuesTools,
  createSearchIssuesTools,
} from './issues.js';
import {
  createCreatePullRequestCommentTool,
  createCreatePullRequestTool,
  createCreateReactionForPullRequestCommentTool,
  createCreateReactionForPullRequestReviewCommentTool,
  createCreateReactionForPullRequestTool,
  createGetPullRequestTool,
  createListPullRequestCommentReactionsTool,
  createListPullRequestCommentsTool,
  createListPullRequestReactionsTool,
  createListPullRequestReviewCommentReactionsTool,
  createListPullRequestsTool,
  createSearchPullRequestsTools,
} from './prs.js';
import {
  createForkRepoTool,
  createListForksTool,
  createListOrgReposTool,
  createListUserReposTool,
} from './repos.js';
import { createGetAuthenticatedUserTool, createListAuthenticatedUserReposTool } from './users.js';
import { githubClient } from './utils/client.js';
import {
  CreateCommentParams,
  CreateCommitParams,
  CreateIssueParams,
  CreatePRCommentParams,
  CreatePullRequestParams,
  GitHubIssueAndPRState,
  GitHubReactionType,
} from './utils/types.js';

export const createGitHubTools = async (token: string, owner: string, repo: string) => {
  const github = await githubClient(token, owner, repo);

  // Issues
  const listIssues = (state: GitHubIssueAndPRState) => github.listIssues(state);
  const searchIssues = (query: string, state: GitHubIssueAndPRState) =>
    github.searchIssues(query, state);
  const getIssue = (issue_number: number) => github.getIssue(issue_number);
  const createIssue = (params: CreateIssueParams) => github.createIssue(params);
  const listIssueComments = (issue_number: number) => github.listIssueComments(issue_number);
  const createIssueComment = (params: CreateCommentParams) => github.createIssueComment(params);
  const listIssueReactions = (issue_number: number) => github.listIssueReactions(issue_number);
  const listIssueCommentReactions = (comment_id: number) =>
    github.listIssueCommentReactions(comment_id);
  const createIssueReaction = (issue_number: number, content: GitHubReactionType) =>
    github.createIssueReaction(issue_number, content);
  const createIssueCommentReaction = (comment_id: number, content: GitHubReactionType) =>
    github.createIssueCommentReaction(comment_id, content);

  // Pull Requests
  const listPullRequests = (state: GitHubIssueAndPRState) => github.listPullRequests(state);
  const searchPullRequests = (query: string, state: GitHubIssueAndPRState) =>
    github.searchPullRequests(query, state);
  const getPullRequest = (pull_number: number) => github.getPullRequest(pull_number);
  const createPullRequest = (params: CreatePullRequestParams) => github.createPullRequest(params);
  const listPullRequestComments = (pull_number: number) =>
    github.listPullRequestComments(pull_number);
  const createPullRequestComment = (params: CreatePRCommentParams) =>
    github.createPullRequestComment(params);
  const listPullRequestReactions = (pull_number: number) =>
    github.listPullRequestReactions(pull_number);
  const listPullRequestCommentReactions = (comment_id: number) =>
    github.listPullRequestCommentReactions(comment_id);
  const listPullRequestReviewCommentReactions = (pull_number: number, comment_id: number) =>
    github.listPullRequestReviewCommentReactions(pull_number, comment_id);
  const createPullRequestReaction = (pull_number: number, content: GitHubReactionType) =>
    github.createPullRequestReaction(pull_number, content);
  const createPullRequestCommentReaction = (comment_id: number, content: GitHubReactionType) =>
    github.createPullRequestCommentReaction(comment_id, content);
  const createPullRequestReviewCommentReaction = (
    pull_number: number,
    comment_id: number,
    content: GitHubReactionType,
  ) => github.createPullRequestReviewCommentReaction(pull_number, comment_id, content);

  // Users
  const getAuthenticatedUser = () => github.getAuthenticatedUser();
  const listAuthenticatedUserRepos = () => github.listAuthenticatedUserRepos();

  // Repos
  const listUserRepos = (username: string) => github.listUserRepos(username);
  const listOrgRepos = (org: string) => github.listOrgRepos(org);
  const listForks = (owner: string, repo: string) => github.listForks(owner, repo);
  const createFork = (owner: string, repo: string) => github.createFork(owner, repo);

  // Git
  const createBranch = (
    targetOwner: string,
    targetRepo: string,
    branchName: string,
    sourceBranch: string,
  ) => github.createBranch(targetOwner, targetRepo, branchName, sourceBranch);
  const createCommit = (targetOwner: string, targetRepo: string, params: CreateCommitParams) =>
    github.createCommit(targetOwner, targetRepo, params);

  // Activity
  const getFeed = () => github.getFeed();
  const listNotifications = (all: boolean) => github.listNotifications(all);
  const subscribeToRepo = (owner: string, repo: string, ignored: boolean) =>
    github.subscribeToRepo(owner, repo, ignored);
  const unsubscribeFromRepo = (owner: string, repo: string) =>
    github.unsubscribeFromRepo(owner, repo);
  const listSubscriptions = () => github.listSubscriptions();
  const listMentions = () => github.listMentions();

  return [
    // Activity
    createGetFeedTool(getFeed),
    createListNotificationsTool(listNotifications),
    createWatchRepoTool(subscribeToRepo),
    createUnwatchRepoTool(unsubscribeFromRepo),
    createListWatchedReposTool(listSubscriptions),
    createListMentionsTool(listMentions),

    // Issues
    createListIssuesTools(listIssues),
    createSearchIssuesTools(searchIssues),
    createGetIssueTools(getIssue),
    createCreateIssueTool(createIssue),
    createListIssueCommentsTools(listIssueComments),
    createCreateIssueCommentTool(createIssueComment),
    createListIssueReactionsTools(listIssueReactions),
    createListIssueCommentReactionsTools(listIssueCommentReactions),
    createCreateReactionForIssueTool(createIssueReaction),
    createCreateReactionForIssueCommentTool(createIssueCommentReaction),

    // Pull Requests
    createListPullRequestsTool(listPullRequests),
    createSearchPullRequestsTools(searchPullRequests),
    createGetPullRequestTool(getPullRequest),
    createCreatePullRequestTool(createPullRequest),
    createListPullRequestCommentsTool(listPullRequestComments),
    createCreatePullRequestCommentTool(createPullRequestComment),
    createListPullRequestReactionsTool(listPullRequestReactions),
    createListPullRequestCommentReactionsTool(listPullRequestCommentReactions),
    createListPullRequestReviewCommentReactionsTool(listPullRequestReviewCommentReactions),
    createCreateReactionForPullRequestTool(createPullRequestReaction),
    createCreateReactionForPullRequestCommentTool(createPullRequestCommentReaction),
    createCreateReactionForPullRequestReviewCommentTool(createPullRequestReviewCommentReaction),

    // Users
    createGetAuthenticatedUserTool(getAuthenticatedUser),
    createListAuthenticatedUserReposTool(listAuthenticatedUserRepos),

    // Repos
    createListUserReposTool(listUserRepos),
    createListOrgReposTool(listOrgRepos),
    createListForksTool(listForks),
    createForkRepoTool(createFork),

    // Git
    createCreateBranchTool(createBranch),
    createCommitTool(createCommit),
  ];
};
