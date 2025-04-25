import { BaseMessage, SystemMessage } from '@langchain/core/messages';
import { Logger } from 'winston';

export const prepareAnthropicPrompt = (
  formattedMessages: BaseMessage[],
  logger: Logger,
): BaseMessage[] => {
  // Check if the array is valid and has messages
  if (!Array.isArray(formattedMessages) || formattedMessages.length === 0) {
    // Return original messages if invalid input
    return formattedMessages;
  }

  const first = formattedMessages[0];

  // Check if the first message is a system message suitable for caching
  if (
    first &&
    first.lc_namespace?.includes('messages') && // Check if it's a LangChain message object structure
    typeof (first.content ?? first.lc_kwargs?.content) === 'string' // Check if content is a string
  ) {
    const content = first.content ?? first.lc_kwargs?.content;
    // Only add cache block if content is not empty
    if (content) {
      const cacheBlock = {
        type: 'text',
        text: content,
        cache_control: { type: 'ephemeral' },
      };
      const modifiedPrompt = [
        new SystemMessage({
          // Explicitly create the correct type
          content: [cacheBlock], // Wrap in cache block
          additional_kwargs: first.additional_kwargs || first.lc_kwargs?.additional_kwargs || {},
          response_metadata: first.response_metadata || first.lc_kwargs?.response_metadata || {},
        }),
        ...formattedMessages.slice(1), // Keep the rest as they are
      ];

      // Log confirmation
      logger.info(
        `[Anthropic] Applied cache_control block to first message. Length: ${cacheBlock.text.length} chars.`,
      );
      return modifiedPrompt;
    } else {
      logger.warn('[Anthropic] First message content is empty, skipping cache block.');
    }
  } else {
    logger.warn(
      '[Anthropic] First message structure not suitable for caching, skipping cache block.',
    );
  }

  // Return original messages if caching conditions not met
  return formattedMessages;
};
