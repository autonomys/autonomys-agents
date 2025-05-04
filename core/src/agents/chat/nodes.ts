import { createToolExecutionNode } from './nodes/executor.js';
import { createInputNode } from './nodes/input.js';
import { defaultTools } from './tools.js';
import { ChatNodeConfig } from './types.js';

export const createNodes = (config: ChatNodeConfig) => {
  const executor = createToolExecutionNode({
    tools: defaultTools,
  });

  const inputNode = createInputNode({
    modelConfig: config.modelConfig,
    tools: config.tools ?? defaultTools,
    llmConfig: config.llmConfig,
  });

  return {
    executor,
    inputNode,
  };
};
