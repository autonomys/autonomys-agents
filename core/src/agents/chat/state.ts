import { Annotation } from '@langchain/langgraph';
import { MessagesAnnotation } from '@langchain/langgraph/web';

export const ChatState = Annotation.Root({
  ...MessagesAnnotation.spec,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolCalls: Annotation<any[] | null>({
    default: () => null,
    reducer: (_, update) => update,
  }),
});
