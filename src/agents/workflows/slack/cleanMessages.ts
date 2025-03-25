import { BaseMessage } from '@langchain/core/messages';

/**
 * Cleans Slack messages for storage or monitoring purposes
 * This removes any sensitive information before storing messages
 * NOTE: Currently not used - using default orchestrator cleaner instead
 */
export const cleanSlackMessageData = (messages: BaseMessage[]): unknown => {
  return messages.map(msg => ({
    type: msg._getType(),
    content: msg.content,
    // Add additional cleaning specific to Slack messages here if needed
    // For example, sanitizing user IDs, channel IDs, etc.
  }));
};
