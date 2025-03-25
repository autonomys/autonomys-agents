import { BaseMessage } from '@langchain/core/messages';

/**
 * Cleans GitHub messages for storage or monitoring purposes
 * This removes any sensitive information before storing messages
 */
export const cleanGithubMessageData = (messages: BaseMessage[]): unknown => {
  return messages.map(msg => ({
    type: msg._getType(),
    content: msg.content,
    // Add additional cleaning specific to GitHub messages here if needed
    // For example, sanitizing personal access tokens, etc.
  }));
};
