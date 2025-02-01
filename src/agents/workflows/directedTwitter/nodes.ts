import { TwitterWorkflowConfig } from './types.js';
import { createCollectDataNode } from './nodes/collectDataNode.js';
import { createAnalyzeTrendNode } from './nodes/analyzeTrendNode.js';
import { createGenerateTweetNode } from './nodes/generateTweetNode.js';
import { createUploadToDsnNode } from './nodes/uploadToDsnNode.js';
import { createEngagementNode } from './nodes/engagementNode.js';
import { createSummaryNode } from './nodes/summaryNode.js';
export const createNodes = async (config: TwitterWorkflowConfig) => {
  const collectDataNode = createCollectDataNode(config);
  const analyzeTrendNode = createAnalyzeTrendNode(config);
  const generateTweetNode = createGenerateTweetNode(config);
  const uploadToDsnNode = createUploadToDsnNode(config);
  const engagementNode = createEngagementNode(config);
  const summaryNode = createSummaryNode(config);

  return {
    collectDataNode,
    analyzeTrendNode,
    generateTweetNode,
    uploadToDsnNode,
    engagementNode,
    summaryNode,
  };
};
