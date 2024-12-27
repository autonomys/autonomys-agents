import { AIMessage } from '@langchain/core/messages';
import { WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { convertMessageContentToTweets } from '../../../tools/convertTweetMessages.js';

const logger = createLogger('collect-data-node');

export const createCollectDataNode =
  (config: WorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Collect Data Node - Collecting recent data');

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

    const content = toolResponse.messages[toolResponse.messages.length - 1].content;
    const tweets = convertMessageContentToTweets(content);

    logger.info('Tool response received:', {
      messageCount: tweets.length,
      tweets: tweets,
    });

    return {
      timelineTweets: new Set(tweets),
    };
  };
