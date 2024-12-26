import { MessageContent } from '@langchain/core/messages';

export const parseMessageContent = (content: MessageContent): any => {
  if (typeof content === 'string') {
    return JSON.parse(content);
  }
  if (Array.isArray(content)) {
    return JSON.parse(JSON.stringify(content));
  }
  return content;
};
