import { AIMessage } from '@langchain/core/messages';
import { parseMessageContent, WorkflowConfig } from '../workflow.js';
import { logger } from '../workflow.js';
import { State } from '../workflow.js';
import { tweetSearchSchema } from '../../../schemas/workflow.js';
import * as db from '../../database/index.js';

export const createTimelineNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Timeline Node - Fetching recent tweets');
    const existingTweets =
      state.messages.length > 0
        ? parseMessageContent(state.messages[state.messages.length - 1].content).tweets
        : [];

    logger.info(`Existing tweets: ${existingTweets.length}`);
    const toolResponse = await config.toolNode.invoke({
      messages: [
        new AIMessage({
          content: '',
          tool_calls: [
            {
              name: 'fetch_timeline',
              args: {},
              id: 'fetch_timeline_call',
              type: 'tool_call',
            },
          ],
        }),
      ],
    });

    logger.info('Tool response received:', {
      messageCount: toolResponse.messages.length,
    });

    const content = toolResponse.messages[toolResponse.messages.length - 1].content;
    const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

    const parsedTweets = tweetSearchSchema.parse(parsedContent);

    const newTweets = [...existingTweets];
    for (const tweet of parsedTweets.tweets) {
      if (await db.isTweetExists(tweet.id)) {
        continue;
      }
      newTweets.push(tweet);
    }

    return {
      messages: [
        new AIMessage({
          content: JSON.stringify({
            tweets: newTweets,
          }),
        }),
      ],
      lastProcessedId: parsedTweets.lastProcessedId || undefined,
    };
  };
};
