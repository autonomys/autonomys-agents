import { Annotation } from '@langchain/langgraph/web';
import { WorkflowControl } from './nodes/inputPrompt.js';
import { PruningParameters } from './types.js';
import { BaseMessage } from '@langchain/core/messages';

export const OrchestratorState = (pruningParameters: PruningParameters) =>
  Annotation.Root({
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
          return [curr[0], update[0], ...curr.slice(pruningParameters.maxWindowSummary)];
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toolCalls: Annotation<any[] | null>({
      default: () => null,
      reducer: (_, update) => update,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    executedTools: Annotation<any[]>({
      default: () => [],
      reducer: (curr, update) => [...curr, ...(update || [])],
    }),
  });
