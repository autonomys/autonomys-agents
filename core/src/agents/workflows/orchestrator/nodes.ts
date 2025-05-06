import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createFinishWorkflowNode } from './nodes/finishWorkflowNode.js';
import { createToolExecutionNode } from './nodes/toolExecutionNode.js';
import { OrchestratorConfig } from './types.js';
import { DynamicStructuredTool } from '@langchain/core/tools';

// Define a type for the nodes object
export interface OrchestratorNodes {
  inputNode: ReturnType<typeof createInputNode>;
  messageSummaryNode: ReturnType<typeof createMessageSummaryNode>;
  finishWorkflowNode: ReturnType<typeof createFinishWorkflowNode>;
  toolExecutionNode: ReturnType<typeof createToolExecutionNode>;
}

export const createNodes = async ({
  modelConfigurations,
  tools,
  prompts,
  pruningParameters,
  namespace,
  apiConfig,
  llmConfig,
  stopCounterLimit,
}: OrchestratorConfig): Promise<OrchestratorNodes> => {
  const { inputPrompt, messageSummaryPrompt, finishWorkflowPrompt } = prompts;
  const { inputModelConfig, messageSummaryModelConfig, finishWorkflowModelConfig } =
    modelConfigurations;

  const inputNode = createInputNode({
    modelConfig: inputModelConfig,
    inputPrompt,
    tools,
    namespace,
    apiConfig,
    llmConfig,
  });
  const messageSummaryNode = createMessageSummaryNode({
    modelConfig: messageSummaryModelConfig,
    messageSummaryPrompt,
    pruningParameters,
    namespace,
    apiConfig,
    llmConfig,
  });
  const finishWorkflowNode = createFinishWorkflowNode({
    modelConfig: finishWorkflowModelConfig,
    finishWorkflowPrompt,
    namespace,
    apiConfig,
    llmConfig,
  });
  const toolExecutionNode = createToolExecutionNode({
    tools: tools as DynamicStructuredTool[],
    namespace,
    apiConfig,
    stopCounterLimit,
  });
  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    toolExecutionNode,
  };
};
