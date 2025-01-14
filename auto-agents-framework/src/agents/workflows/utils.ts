import { MessageContent } from '@langchain/core/messages';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseMessageContent = (content: MessageContent): any => {
  if (typeof content === 'string') {
    return JSON.parse(content);
  }
  if (Array.isArray(content)) {
    return JSON.parse(JSON.stringify(content));
  }
  return content;
};
