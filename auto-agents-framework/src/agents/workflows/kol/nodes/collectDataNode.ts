import { AIMessage } from '@langchain/core/messages';
import { WorkflowConfig } from '../types.js';
import { parseMessageContent } from '../../utils.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { v4 as generateID } from 'uuid';

const logger = createLogger('collect-data-node');

export const createCollectDataNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
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

    logger.info('Tool response received:', {
      messageCount: toolResponse.messages.length,
      messages: toolResponse.messages,
    });

    const content = toolResponse.messages[toolResponse.messages.length - 1].content;
    const parsedContent = parseMessageContent(content);

    return {
      messages: [
        new AIMessage({
          content: JSON.stringify({
            tweets: parsedContent.tweets,
          }),
        }),
      ],
    };
  };
};
