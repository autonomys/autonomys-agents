import { BaseMessage } from '@langchain/core/messages';
import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import { MessagesAnnotation } from '@langchain/langgraph/web';

export const ChatState = Annotation.Root({
  ...MessagesAnnotation.spec,
  language: Annotation<string>(),
});
