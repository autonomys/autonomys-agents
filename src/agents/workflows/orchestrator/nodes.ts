import { createInputNode } from './nodes/inputNode.js';
import { OrchestratorConfig } from './types.js';

export const createNodes = async (config: OrchestratorConfig) => {
  const inputNode = createInputNode(config);
  const { toolNode } = config;
  return {
    inputNode,
    toolNode,
  };
};
