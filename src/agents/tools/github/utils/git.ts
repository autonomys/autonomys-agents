import { RestEndpointMethodTypes } from '@octokit/rest';
import { CreateCommitParams, GithubClient, GithubResponse } from './types.js';

export const createBranch = async (
  client: GithubClient,
  owner: string,
  repo: string,
  branchName: string,
  sourceBranch: string,
): Promise<GithubResponse<RestEndpointMethodTypes['git']['createRef']['response']['data']>> => {
  // First, get the SHA of the source branch
  const sourceRef = await client.git.getRef({
    owner,
    repo,
    ref: `heads/${sourceBranch}`,
  });

  // Create the new branch using the source branch's SHA
  const response = await client.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: sourceRef.data.object.sha,
  });

  return {
    success: true,
    data: response.data,
  };
};

export const createCommit = async (
  client: GithubClient,
  owner: string,
  repo: string,
  params: CreateCommitParams,
): Promise<GithubResponse<RestEndpointMethodTypes['git']['updateRef']['response']['data']>> => {
  // First, get the latest commit SHA of the branch
  const branchData = await client.git.getRef({
    owner,
    repo,
    ref: `heads/${params.branch}`,
  });
  const latestCommitSha = branchData.data.object.sha;

  // Get the base tree
  const baseTree = await client.git.getCommit({
    owner,
    repo,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = baseTree.data.tree.sha;

  // Create blobs for each file change
  const blobPromises = params.changes.map(change =>
    client.git.createBlob({
      owner,
      repo,
      content: change.content,
      encoding: 'utf-8',
    }),
  );
  const blobs = await Promise.all(blobPromises);

  // Create a new tree with the file changes
  const tree = await client.git.createTree({
    owner,
    repo,
    base_tree: baseTreeSha,
    tree: params.changes.map((change, index) => ({
      path: change.path,
      mode: '100644',
      type: 'blob',
      sha: blobs[index].data.sha,
    })),
  });

  // Create the commit
  const commit = await client.git.createCommit({
    owner,
    repo,
    message: params.message,
    tree: tree.data.sha,
    parents: [latestCommitSha],
  });

  // Update the branch reference
  const response = await client.git.updateRef({
    owner,
    repo,
    ref: `heads/${params.branch}`,
    sha: commit.data.sha,
  });

  return {
    success: true,
    data: response.data,
  };
};
