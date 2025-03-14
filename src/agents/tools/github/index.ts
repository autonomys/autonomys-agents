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

export const createGitHubTools = async (token: string) => {
  const github = await githubClient(token);

  // Issues
  const listIssues = (owner: string, repo: string, state: GitHubIssueAndPRState) =>
    github.listIssues(owner, repo, state);
  const searchIssues = (owner: string, repo: string, query: string, state: GitHubIssueAndPRState) =>
    github.searchIssues(owner, repo, query, state);
  const getIssue = (owner: string, repo: string, issue_number: number) =>
    github.getIssue(owner, repo, issue_number);
  const createIssue = (owner: string, repo: string, params: CreateIssueParams) =>
    github.createIssue(owner, repo, params);
  const listIssueComments = (owner: string, repo: string, issue_number: number) =>
    github.listIssueComments(owner, repo, issue_number);
  const createIssueComment = (owner: string, repo: string, params: CreateCommentParams) =>
    github.createIssueComment(owner, repo, params);
  const listIssueReactions = (owner: string, repo: string, issue_number: number) =>
    github.listIssueReactions(owner, repo, issue_number);
  const listIssueCommentReactions = (owner: string, repo: string, comment_id: number) =>
    github.listIssueCommentReactions(owner, repo, comment_id);
  const createIssueReaction = (
    owner: string,
    repo: string,
    issue_number: number,
    content: GitHubReactionType,
  ) => github.createIssueReaction(owner, repo, issue_number, content);
  const createIssueCommentReaction = (
    owner: string,
    repo: string,
    comment_id: number,
    content: GitHubReactionType,
  ) => github.createIssueCommentReaction(owner, repo, comment_id, content);

  // Pull Requests
  const listPullRequests = (owner: string, repo: string, state: GitHubIssueAndPRState) =>
    github.listPullRequests(owner, repo, state);
  const searchPullRequests = (
    owner: string,
    repo: string,
    query: string,
    state: GitHubIssueAndPRState,
  ) => github.searchPullRequests(owner, repo, query, state);
  const getPullRequest = (owner: string, repo: string, pull_number: number) =>
    github.getPullRequest(owner, repo, pull_number);
  const createPullRequest = (owner: string, repo: string, params: CreatePullRequestParams) =>
    github.createPullRequest(owner, repo, params);
  const listPullRequestComments = (owner: string, repo: string, pull_number: number) =>
    github.listPullRequestComments(owner, repo, pull_number);
  const createPullRequestComment = (owner: string, repo: string, params: CreatePRCommentParams) =>
    github.createPullRequestComment(owner, repo, params);
  const listPullRequestReactions = (owner: string, repo: string, pull_number: number) =>
    github.listPullRequestReactions(owner, repo, pull_number);
  const listPullRequestCommentReactions = (owner: string, repo: string, comment_id: number) =>
    github.listPullRequestCommentReactions(owner, repo, comment_id);
  const listPullRequestReviewCommentReactions = (
    owner: string,
    repo: string,
    pull_number: number,
    comment_id: number,
  ) => github.listPullRequestReviewCommentReactions(owner, repo, pull_number, comment_id);
  const createPullRequestReaction = (
    owner: string,
    repo: string,
    pull_number: number,
    content: GitHubReactionType,
  ) => github.createPullRequestReaction(owner, repo, pull_number, content);
  const createPullRequestCommentReaction = (
    owner: string,
    repo: string,
    comment_id: number,
    content: GitHubReactionType,
  ) => github.createPullRequestCommentReaction(owner, repo, comment_id, content);
  const createPullRequestReviewCommentReaction = (
    owner: string,
    repo: string,
    pull_number: number,
    comment_id: number,
    content: GitHubReactionType,
  ) => github.createPullRequestReviewCommentReaction(owner, repo, pull_number, comment_id, content);

  // Users
  const getAuthenticatedUser = () => github.getAuthenticatedUser();
  const listAuthenticatedUserRepos = () => github.listAuthenticatedUserRepos();

  // Repos
  const listUserRepos = (username: string) => github.listUserRepos(username);
  const listOrgRepos = (org: string) => github.listOrgRepos(org);
  const listForks = (owner: string, repo: string) => github.listForks(owner, repo);
  const createFork = (owner: string, repo: string) => github.createFork(owner, repo);

  // Git
  const createBranch = (owner: string, repo: string, branchName: string, sourceBranch: string) =>
    github.createBranch(owner, repo, branchName, sourceBranch);
  const createCommit = (owner: string, repo: string, params: CreateCommitParams) =>
    github.createCommit(owner, repo, params);

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
