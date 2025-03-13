import { RestEndpointMethodTypes } from '@octokit/rest';
import { createLogger } from '../../../../utils/logger.js';
import { CreateCommitParams, GithubClientWithOptions, GithubResponse } from './types.js';

const logger = createLogger('github-git');

export const createBranch = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
  branchName: string,
  sourceBranch: string,
): Promise<GithubResponse<RestEndpointMethodTypes['git']['createRef']['response']['data']>> => {
  const { githubClient } = client;
  try {
    // First, get the SHA of the source branch
    const sourceRef = await githubClient.git.getRef({
      owner: targetOwner,
      repo: targetRepo,
      ref: `heads/${sourceBranch}`,
    });

    // Create the new branch using the source branch's SHA
    const response = await githubClient.git.createRef({
      owner: targetOwner,
      repo: targetRepo,
      ref: `refs/heads/${branchName}`,
      sha: sourceRef.data.object.sha,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error creating GitHub branch:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};

export const createCommit = async (
  client: GithubClientWithOptions,
  targetOwner: string,
  targetRepo: string,
  params: CreateCommitParams,
): Promise<GithubResponse<RestEndpointMethodTypes['git']['updateRef']['response']['data']>> => {
  const { githubClient } = client;
  try {
    // First, get the latest commit SHA of the branch
    const branchData = await githubClient.git.getRef({
      owner: targetOwner,
      repo: targetRepo,
      ref: `heads/${params.branch}`,
    });
    const latestCommitSha = branchData.data.object.sha;

    // Get the base tree
    const baseTree = await githubClient.git.getCommit({
      owner: targetOwner,
      repo: targetRepo,
      commit_sha: latestCommitSha,
    });
    const baseTreeSha = baseTree.data.tree.sha;

    // Create blobs for each file change
    const blobPromises = params.changes.map(change =>
      githubClient.git.createBlob({
        owner: targetOwner,
        repo: targetRepo,
        content: change.content,
        encoding: 'utf-8',
      }),
    );
    const blobs = await Promise.all(blobPromises);

    // Create a new tree with the file changes
    const tree = await githubClient.git.createTree({
      owner: targetOwner,
      repo: targetRepo,
      base_tree: baseTreeSha,
      tree: params.changes.map((change, index) => ({
        path: change.path,
        mode: '100644',
        type: 'blob',
        sha: blobs[index].data.sha,
      })),
    });

    // Create the commit
    const commit = await githubClient.git.createCommit({
      owner: targetOwner,
      repo: targetRepo,
      message: params.message,
      tree: tree.data.sha,
      parents: [latestCommitSha],
    });

    // Update the branch reference
    const response = await githubClient.git.updateRef({
      owner: targetOwner,
      repo: targetRepo,
      ref: `heads/${params.branch}`,
      sha: commit.data.sha,
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    logger.error('Error creating GitHub commit:', error);
    return {
      success: false,
      error: error as Error,
    };
  }
};
