import { BaseMessage } from '@langchain/core/messages';
import { Annotation } from '@langchain/langgraph/web';
import { Runnable } from '@langchain/core/runnables';
import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export type OrchestratorConfig = {
  orchestratorModel: Runnable<BaseLanguageModelInput, AIMessageChunk>;
  toolNode: ToolNode;
  prompts: {
    inputPrompt: ChatPromptTemplate;
    summaryPrompt: ChatPromptTemplate;
  };
};

export type OrchestratorInput = {
  messages: BaseMessage[];
};

export const OrchestratorState = Annotation.Root({
  messages: Annotation<readonly BaseMessage[]>({
    reducer: (curr, update) => {
      if (
        update.length === 1 &&
        update[0].content.toString().startsWith('Summary of conversation earlier:')
      ) {
        return [curr[0], ...update];
      }
      return [...curr, ...update];
    },
    default: () => [],
  }),
  error: Annotation<Error | null>({
    default: () => null,
    reducer: (_, update) => update,
  }),
});
