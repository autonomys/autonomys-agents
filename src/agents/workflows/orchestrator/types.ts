import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph/web';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { config } from '../../../config/index.js';
import { WorkflowControl } from './nodes/inputPrompt.js';

export type OrchestratorPrompts = {
  inputPrompt: ChatPromptTemplate;
  messageSummaryPrompt: ChatPromptTemplate;
  workflowSummaryPrompt: ChatPromptTemplate;
};

export type OrchestratorConfig = {
  orchestratorModel: Runnable<BaseLanguageModelInput, AIMessageChunk>;
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
});
