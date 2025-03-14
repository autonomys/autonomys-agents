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
}: OrchestratorConfig) => {
  const { inputPrompt, messageSummaryPrompt, finishWorkflowPrompt } = prompts;
  const { inputModelConfig, messageSummaryModelConfig, finishWorkflowModelConfig } =
    modelConfigurations;

  const inputNode = createInputNode({
    modelConfig: inputModelConfig,
    inputPrompt,
    tools,
    namespace,
  });
  const messageSummaryNode = createMessageSummaryNode({
    modelConfig: messageSummaryModelConfig,
    messageSummaryPrompt,
    pruningParameters,
    namespace,
  });
  const finishWorkflowNode = createFinishWorkflowNode({
    modelConfig: finishWorkflowModelConfig,
    finishWorkflowPrompt,
    namespace,
  });
  const toolExecutionNode = createToolExecutionNode({
    tools: tools as DynamicStructuredTool[],
    namespace,
  });
  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    toolExecutionNode,
  };
};
