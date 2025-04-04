import { BaseMessage } from '@langchain/core/messages';

const parseJsonString = (input: unknown) => {
  if (typeof input !== 'string') {
    return input;
  }

  try {
    const parsed = JSON.parse(input);
    return parsed;
  } catch {
    return input;
  }
};

export const cleanMessageData = (messages: BaseMessage[]): unknown[] => {
  const parsedMessages = messages.map(message => parseJsonString(message.content));
  return parsedMessages;
};
