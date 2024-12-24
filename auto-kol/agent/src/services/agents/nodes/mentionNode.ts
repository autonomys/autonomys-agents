import { AIMessage } from '@langchain/core/messages';
import { parseMessageContent, WorkflowConfig } from '../workflow.js';
import { logger } from '../workflow.js';
import { State } from '../workflow.js';
import { tweetSearchSchema } from '../../../schemas/workflow.js';

export const createMentionNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Mention Node - Fetching recent mentions');
    const toolResponse = await config.toolNode.invoke({
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [
            {
              name: 'fetch_mentions',
              args: {},
              id: 'fetch_mentions_call',
              type: 'tool_call',
            },
          ],
        }),
      ],
    });

    const parsedContent = parseMessageContent(
      toolResponse.messages[toolResponse.messages.length - 1].content,
    );
    const parsedTweets = tweetSearchSchema.parse(parsedContent);

    return {
      messages: [
        new AIMessage({
          content: JSON.stringify(parsedTweets),
        }),
      ],
      lastProcessedId: parsedTweets.lastProcessedId || undefined,
    };
  };
};
