import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph/web';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { config } from '../../../config/index.js';
import { WorkflowControl } from './nodes/inputPrompt.js';
import { LLMModelType } from '../../../services/llm/factory.js';
import { FinishedWorkflow } from './nodes/finishWorkflowPrompt.js';
export type OrchestratorPrompts = {
  inputPrompt: ChatPromptTemplate;
  messageSummaryPrompt: ChatPromptTemplate;
  finishWorkflowPrompt: ChatPromptTemplate;
};

export type OrchestratorConfig = {
  orchestratorModel: LLMModelType;
  toolNode: ToolNode;
  prompts: OrchestratorPrompts;
};

export type OrchestratorInput = {
  messages: BaseMessage[];
};

export const OrchestratorState = Annotation.Root({
  messages: Annotation<readonly BaseMessage[]>({
    reducer: (curr, update) => {
      if (
        //TODO: Revisit this process, this is quite messy. Maybe we should add state for summary messages?
        Array.isArray(update) &&
        update.length > 0 &&
        update[0]?.content &&
        typeof update[0].content === 'string' &&
        update[0].content.startsWith('Summary of conversation earlier:')
      ) {
        return [curr[0], update[0], ...curr.slice(config.orchestratorConfig.MAX_WINDOW_SUMMARY)];
      } else {
        return [...curr, ...update];
      }
    },
    default: () => [],
  }),
  error: Annotation<Error | null>({
    default: () => null,
    reducer: (_, update) => update,
  }),
  workflowControl: Annotation<WorkflowControl | null>({
    default: () => null,
    reducer: (_, update) => update,
  }),
  finishedWorkflow: Annotation<FinishedWorkflow | null>({
    default: () => null,
    reducer: (_, update) => update,
  }),
});
