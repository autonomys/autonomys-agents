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
}: OrchestratorConfig) => {
  const { inputPrompt, messageSummaryPrompt, finishWorkflowPrompt } = prompts;
  const { inputModelConfig, messageSummaryModelConfig, finishWorkflowModelConfig } =
    modelConfigurations;
  const inputNode = createInputNode({
    modelConfig: inputModelConfig,
    inputPrompt,
    tools,
  });
  const messageSummaryNode = createMessageSummaryNode({
    modelConfig: messageSummaryModelConfig,
    messageSummaryPrompt,
    pruningParameters,
  });
  const finishWorkflowNode = createFinishWorkflowNode({
    modelConfig: finishWorkflowModelConfig,
    finishWorkflowPrompt,
  });
  const toolExecutionNode = createToolExecutionNode({
    tools: tools as DynamicStructuredTool[],
  });
  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    toolExecutionNode,
  };
};
