import { BaseMessage } from '@langchain/core/messages';
import { cleanMessageData } from '../orchestrator/cleanMessages.js';

const removeThreadData = (data: unknown): unknown => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => removeThreadData(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key !== 'thread') {
      result[key] = removeThreadData(value);
    }
  }
  return result;
};

export const cleanTwitterMessageData = (messages: BaseMessage[]) => {
  const cleanedMessages = removeThreadData(cleanMessageData(messages));
  return cleanedMessages;
};
