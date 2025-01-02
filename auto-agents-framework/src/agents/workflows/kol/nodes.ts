import { WorkflowConfig } from './types.js';
import { createCollectDataNode } from './nodes/collectDataNode.js';
import { createAnalyzeTrendNode } from './nodes/analyzeTrendNode.js';
import { createGenerateTweetNode } from './nodes/generateTweetNode.js';
import { createUploadToDsnNode } from './nodes/uploadToDsnNode.js';
import { createEngagementNode } from './nodes/engagementNode.js';

export const createNodes = async (config: WorkflowConfig) => {
  const collectDataNode = createCollectDataNode(config);
  const analyzeTrendNode = createAnalyzeTrendNode(config);
  const generateTweetNode = createGenerateTweetNode(config);
  const uploadToDsnNode = createUploadToDsnNode(config);
  const engagementNode = createEngagementNode(config);

  return {
    collectDataNode,
    analyzeTrendNode,
    generateTweetNode,
    uploadToDsnNode,
    engagementNode,
  };
};
