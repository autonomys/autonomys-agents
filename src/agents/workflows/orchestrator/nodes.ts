import { createInputNode } from './nodes/inputNode.js';
import { createMessageSummaryNode } from './nodes/messageSummaryNode.js';
import { createFinishWorkflowNode } from './nodes/finishWorkflowNode.js';
import { OrchestratorConfig } from './orchestratorWorkflow.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';

export const createNodes = async ({
  modelConfig,
  tools,
  prompts,
  pruningParameters,
  vectorStore,
}: OrchestratorConfig) => {
  const { inputPrompt, messageSummaryPrompt, finishWorkflowPrompt } = prompts;
  const inputNode = createInputNode({
    modelConfig,
    inputPrompt,
    tools,
    vectorStore,
  });
  const messageSummaryNode = createMessageSummaryNode({
    modelConfig,
    messageSummaryPrompt,
    pruningParameters,
    vectorStore,
  });
  const finishWorkflowNode = createFinishWorkflowNode({
    modelConfig,
    finishWorkflowPrompt,
    vectorStore,
  });
  const toolNode = new ToolNode(tools);
  return {
    inputNode,
    messageSummaryNode,
    finishWorkflowNode,
    toolNode,
  };
};
