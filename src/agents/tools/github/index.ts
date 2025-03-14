import { DynamicStructuredTool } from '@langchain/core/tools';
import {
  createGetFeedTool,
  createListMentionsTool,
  createListNotificationsTool,
  createListWatchedReposTool,
  createUnwatchRepoTool,
  createWatchRepoTool,
} from './activity.js';
import {
  createCommitTool,
  createCreateBranchTool,
  createGetCommitTool,
  createGetRefTool,
} from './git.js';
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
  createCreatePullRequestReviewTool,
  createCreatePullRequestTool,
  createCreateReactionForPullRequestCommentTool,
  createCreateReactionForPullRequestReviewCommentTool,
  createCreateReactionForPullRequestTool,
  createGetPullRequestTool,
  createListPullRequestCommentReactionsTool,
  createListPullRequestCommentsTool,
  createListPullRequestReactionsTool,
  createListPullRequestReviewCommentReactionsTool,
  createListPullRequestReviewsTool,
  createListPullRequestsTool,
  createSearchPullRequestsTools,
  createSubmitPullRequestReviewTool,
  createUpdatePullRequestReviewTool,
} from './prs.js';
import {
  createAddCollaboratorTool,
  createCompareCommitsTool,
  createForkRepoTool,
  createGetDefaultBranchTool,
  createGetRepoBranchTool,
  createGetRepoRefContentTool,
  createListContributorsTool,
  createListForksTool,
  createListOrgReposTool,
  createListUserReposTool,
  createRemoveCollaboratorTool,
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
  GitHubPullRequestReviewEvent,
  GitHubReactionType,
} from './utils/types.js';

// These subsets are used to create a subset of tools based on the user's needs
// They are progressive, following this order:
// USER -> REACTIONS -> COMMENTS -> ISSUES_CONTRIBUTOR -> CODE_CONTRIBUTOR -> ALL
// Meaning, if you create the tools with subset ISSUES_CONTRIBUTOR, you will have USER, REACTIONS and COMMENTS tools also available
export enum GitHubToolsSubset {
  NONE = 'none',
  USER = 'user',
  REACTIONS = 'reactions',
  COMMENTS = 'comments',
  ISSUES_CONTRIBUTOR = 'issues_contributor',
  CODE_CONTRIBUTOR = 'code_contributor',
  ALL = 'all',
}

const subsetOrder = (subset: GitHubToolsSubset) => Object.values(GitHubToolsSubset).indexOf(subset);

export const createGitHubTools = async (
  token: string,
  subset: GitHubToolsSubset = GitHubToolsSubset.USER,
): Promise<DynamicStructuredTool[]> => {
  const github = await githubClient(token);
  const tools = [];

  if (subsetOrder(subset) >= subsetOrder(GitHubToolsSubset.USER)) {
    // Activity
    const getFeed = () => github.getFeed();
    const listNotifications = (all: boolean) => github.listNotifications(all);
    const subscribeToRepo = (owner: string, repo: string, ignored: boolean) =>
      github.subscribeToRepo(owner, repo, ignored);
    const unsubscribeFromRepo = (owner: string, repo: string) =>
      github.unsubscribeFromRepo(owner, repo);
    const listSubscriptions = () => github.listSubscriptions();
    const listMentions = () => github.listMentions();

    tools.push(
      createGetFeedTool(getFeed),
      createListNotificationsTool(listNotifications),
      createWatchRepoTool(subscribeToRepo),
      createUnwatchRepoTool(unsubscribeFromRepo),
      createListWatchedReposTool(listSubscriptions),
      createListMentionsTool(listMentions),
    );

    // Users
    const getAuthenticatedUser = () => github.getAuthenticatedUser();
    const listAuthenticatedUserRepos = () => github.listAuthenticatedUserRepos();
    tools.push(
      createGetAuthenticatedUserTool(getAuthenticatedUser),
      createListAuthenticatedUserReposTool(listAuthenticatedUserRepos),
    );
  }

  if (subsetOrder(subset) >= subsetOrder(GitHubToolsSubset.REACTIONS)) {
    // Issues
    const listIssues = (owner: string, repo: string, state: GitHubIssueAndPRState) =>
      github.listIssues(owner, repo, state);
    const getIssue = (owner: string, repo: string, issue_number: number) =>
      github.getIssue(owner, repo, issue_number);
    const listIssueComments = (owner: string, repo: string, issue_number: number) =>
      github.listIssueComments(owner, repo, issue_number);
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

    tools.push(
      createListIssuesTools(listIssues),
      createGetIssueTools(getIssue),
      createListIssueCommentsTools(listIssueComments),
      createListIssueReactionsTools(listIssueReactions),
      createListIssueCommentReactionsTools(listIssueCommentReactions),
      createCreateReactionForIssueTool(createIssueReaction),
      createCreateReactionForIssueCommentTool(createIssueCommentReaction),
    );

    // Pull Requests
    const listPullRequests = (owner: string, repo: string, state: GitHubIssueAndPRState) =>
      github.listPullRequests(owner, repo, state);
    const getPullRequest = (owner: string, repo: string, pull_number: number) =>
      github.getPullRequest(owner, repo, pull_number);
    const listPullRequestComments = (owner: string, repo: string, pull_number: number) =>
      github.listPullRequestComments(owner, repo, pull_number);
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
    ) =>
      github.createPullRequestReviewCommentReaction(owner, repo, pull_number, comment_id, content);

    tools.push(
      createListPullRequestsTool(listPullRequests),
      createGetPullRequestTool(getPullRequest),
      createListPullRequestCommentsTool(listPullRequestComments),
      createListPullRequestReactionsTool(listPullRequestReactions),
      createListPullRequestCommentReactionsTool(listPullRequestCommentReactions),
      createListPullRequestReviewCommentReactionsTool(listPullRequestReviewCommentReactions),
      createCreateReactionForPullRequestTool(createPullRequestReaction),
      createCreateReactionForPullRequestCommentTool(createPullRequestCommentReaction),
      createCreateReactionForPullRequestReviewCommentTool(createPullRequestReviewCommentReaction),
    );

    // Repos
    const listUserRepos = (username: string) => github.listUserRepos(username);
    const listOrgRepos = (org: string) => github.listOrgRepos(org);
    tools.push(createListUserReposTool(listUserRepos), createListOrgReposTool(listOrgRepos));
  }

  if (subsetOrder(subset) >= subsetOrder(GitHubToolsSubset.COMMENTS)) {
    // Issues
    const searchIssues = (
      owner: string,
      repo: string,
      query: string,
      state: GitHubIssueAndPRState,
    ) => github.searchIssues(owner, repo, query, state);
    const createIssueComment = (owner: string, repo: string, params: CreateCommentParams) =>
      github.createIssueComment(owner, repo, params);
    tools.push(
      createSearchIssuesTools(searchIssues),
      createCreateIssueCommentTool(createIssueComment),
    );

    // Pull Requests
    const searchPullRequests = (
      owner: string,
      repo: string,
      query: string,
      state: GitHubIssueAndPRState,
    ) => github.searchPullRequests(owner, repo, query, state);
    const createPullRequestComment = (owner: string, repo: string, params: CreatePRCommentParams) =>
      github.createPullRequestComment(owner, repo, params);
    const listPullRequestReviews = (owner: string, repo: string, pull_number: number) =>
      github.listPullRequestReviews(owner, repo, pull_number);
    tools.push(
      createSearchPullRequestsTools(searchPullRequests),
      createCreatePullRequestCommentTool(createPullRequestComment),
      createListPullRequestReviewsTool(listPullRequestReviews),
    );
  }
  if (subsetOrder(subset) >= subsetOrder(GitHubToolsSubset.ISSUES_CONTRIBUTOR)) {
    // Issues
    const createIssue = (owner: string, repo: string, params: CreateIssueParams) =>
      github.createIssue(owner, repo, params);
    tools.push(createCreateIssueTool(createIssue));
  }
  if (subsetOrder(subset) >= subsetOrder(GitHubToolsSubset.CODE_CONTRIBUTOR)) {
    // Pull Requests
    const createPullRequest = (owner: string, repo: string, params: CreatePullRequestParams) =>
      github.createPullRequest(owner, repo, params);
    const createPullRequestReview = (
      owner: string,
      repo: string,
      pull_number: number,
      event: GitHubPullRequestReviewEvent,
      body?: string,
    ) => github.createPullRequestReview(owner, repo, pull_number, event, body);
    const updatePullRequestReview = (
      owner: string,
      repo: string,
      pull_number: number,
      review_id: number,
      event: GitHubPullRequestReviewEvent,
      body: string,
    ) => github.updatePullRequestReview(owner, repo, pull_number, review_id, event, body);
    const submitPullRequestReview = (
      owner: string,
      repo: string,
      pull_number: number,
      review_id: number,
      event: GitHubPullRequestReviewEvent,
      body?: string,
    ) => github.submitPullRequestReview(owner, repo, pull_number, review_id, event, body);
    tools.push(
      createCreatePullRequestTool(createPullRequest),
      createCreatePullRequestReviewTool(createPullRequestReview),
      createUpdatePullRequestReviewTool(updatePullRequestReview),
      createSubmitPullRequestReviewTool(submitPullRequestReview),
    );

    // Repos
    const listForks = (owner: string, repo: string) => github.listForks(owner, repo);
    const createFork = (owner: string, repo: string) => github.createFork(owner, repo);
    const getDefaultBranch = (owner: string, repo: string) => github.getDefaultBranch(owner, repo);
    const getRepoBranch = (owner: string, repo: string, branch: string) =>
      github.getRepoBranch(owner, repo, branch);
    const getRepoRefContent = (owner: string, repo: string, path: string, ref: string) =>
      github.getRepoRefContent(owner, repo, path, ref);
    const listContributors = (owner: string, repo: string) => github.listContributors(owner, repo);
    const addCollaborator = (owner: string, repo: string, username: string) =>
      github.addCollaborator(owner, repo, username);
    const removeCollaborator = (owner: string, repo: string, username: string) =>
      github.removeCollaborator(owner, repo, username);
    const compareCommits = (owner: string, repo: string, base: string, head: string) =>
      github.compareCommits(owner, repo, base, head);
    tools.push(
      createListForksTool(listForks),
      createForkRepoTool(createFork),
      createGetDefaultBranchTool(getDefaultBranch),
      createGetRepoBranchTool(getRepoBranch),
      createGetRepoRefContentTool(getRepoRefContent),
      createListContributorsTool(listContributors),
      createAddCollaboratorTool(addCollaborator),
      createRemoveCollaboratorTool(removeCollaborator),
      createCompareCommitsTool(compareCommits),
    );

    // Git
    const getCommit = (owner: string, repo: string, commit_sha: string) =>
      github.getCommit(owner, repo, commit_sha);
    const getRef = (owner: string, repo: string, ref: string) => github.getRef(owner, repo, ref);
    const createBranch = (owner: string, repo: string, branchName: string, sourceBranch: string) =>
      github.createBranch(owner, repo, branchName, sourceBranch);
    const createCommit = (owner: string, repo: string, params: CreateCommitParams) =>
      github.createCommit(owner, repo, params);
    tools.push(
      createGetCommitTool(getCommit),
      createGetRefTool(getRef),
      createCreateBranchTool(createBranch),
      createCommitTool(createCommit),
    );
  }

  return tools as DynamicStructuredTool[];
};
