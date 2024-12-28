import { WorkflowConfig } from './types.js';
import { createCollectDataNode } from './nodes/collectDataNode.js';
import { createAnalyzeTrendNode } from './nodes/analyzeTrendNode.js';
import { createGenerateTweetNode } from './nodes/generateTweetNode.js';

export const createNodes = async (config: WorkflowConfig) => {
  ///////////MENTIONS///////////
  const collectDataNode = createCollectDataNode(config);
  const analyzeTrendNode = createAnalyzeTrendNode(config);
  const generateTweetNode = createGenerateTweetNode(config);

  return {
    collectDataNode,
    analyzeTrendNode,
    generateTweetNode,
  };
};
