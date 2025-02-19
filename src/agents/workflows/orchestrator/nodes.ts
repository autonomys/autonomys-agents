import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createFinishWorkflowNode } from './nodes/finishWorkflowNode.js';
import { createToolExecutionNode } from './nodes/toolExecutionNode.js';
import { OrchestratorConfig } from './orchestratorWorkflow.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';

export const createNodes = async ({
  modelConfigurations,
  tools,
  prompts,
  pruningParameters,
  vectorStore,
}: OrchestratorConfig) => {
  const { inputPrompt, messageSummaryPrompt, finishWorkflowPrompt } = prompts;
  const { inputModelConfig, messageSummaryModelConfig, finishWorkflowModelConfig } =
    modelConfigurations;
  const inputNode = createInputNode({
    modelConfig: inputModelConfig,
    inputPrompt,
    tools,
    vectorStore,
  });
  const messageSummaryNode = createMessageSummaryNode({
    modelConfig: messageSummaryModelConfig,
    messageSummaryPrompt,
    pruningParameters,
    vectorStore,
  });
  const finishWorkflowNode = createFinishWorkflowNode({
    modelConfig: finishWorkflowModelConfig,
    finishWorkflowPrompt,
    vectorStore,
  });
  const toolExecutionNode = createToolExecutionNode({
    tools,
  });
  const toolNode = new ToolNode(tools);
  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    toolExecutionNode,
    toolNode,
  };
};
