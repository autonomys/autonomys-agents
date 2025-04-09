import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createFinishWorkflowNode } from './nodes/finishWorkflowNode.js';
import { createToolExecutionNode } from './nodes/toolExecutionNode.js';
import { OrchestratorConfig } from './types.js';
import { DynamicStructuredTool } from '@langchain/core/tools';

export const createNodes = async ({
  modelConfigurations,
  tools,
  prompts,
  pruningParameters,
  namespace,
  characterDataPathConfig,
  apiConfig,
  characterName,
}: OrchestratorConfig) => {
  const { inputPrompt, messageSummaryPrompt, finishWorkflowPrompt } = prompts;
  const { inputModelConfig, messageSummaryModelConfig, finishWorkflowModelConfig } =
    modelConfigurations;

  const inputNode = createInputNode({
    modelConfig: inputModelConfig,
    inputPrompt,
    tools,
    characterName,
    dataPath: characterDataPathConfig.dataPath,
    namespace,
    apiConfig,
  });
  const messageSummaryNode = createMessageSummaryNode({
    modelConfig: messageSummaryModelConfig,
    messageSummaryPrompt,
    pruningParameters,
    characterName,
    dataPath: characterDataPathConfig.dataPath,
    namespace,
    apiConfig,
  });
  const finishWorkflowNode = createFinishWorkflowNode({
    modelConfig: finishWorkflowModelConfig,
    finishWorkflowPrompt,
    characterName,
    dataPath: characterDataPathConfig.dataPath,
    namespace,
    apiConfig,
  });
  const toolExecutionNode = createToolExecutionNode({
    tools: tools as DynamicStructuredTool[],
    characterName,
    dataPath: characterDataPathConfig.dataPath,
    namespace,
    apiConfig,
  });
  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    toolExecutionNode,
  };
};
