import { createToolExecutionNode } from './nodes/executor.js';
import { createInputNode } from './nodes/input.js';
import { ChatNodeConfig } from './types.js';

export const createNodes = (config: ChatNodeConfig) => {
  const executor = createToolExecutionNode({
    tools: config.tools,
  });

  const inputNode = createInputNode({
    modelConfig: config.modelConfig,
    tools: config.tools,
    llmConfig: config.llmConfig,
    promptTemplate: config.promptTemplate,
  });

  return {
    executor,
    inputNode,
  };
};
