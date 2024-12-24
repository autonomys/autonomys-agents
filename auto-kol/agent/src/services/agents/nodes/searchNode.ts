import { AIMessage } from '@langchain/core/messages';
import { State, logger, parseMessageContent } from '../workflow.js';
import { tweetSearchSchema } from '../../../schemas/workflow.js';
import { ChromaService } from '../../vectorstore/chroma.js';
import * as db from '../../database/index.js';
import { WorkflowConfig } from '../workflow.js';

export const createSearchNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Search Node - Fetching recent tweets');
    const existingTweets =
      state.messages.length > 0
        ? parseMessageContent(state.messages[state.messages.length - 1].content).tweets
        : [];

    logger.info(`Existing tweets: ${existingTweets.length}`);
    try {
      logger.info('Last processed id:', state.lastProcessedId);

      const toolResponse = await config.toolNode.invoke({
        messages: [
          new AIMessage({
            content: '',
            tool_calls: [
              {
                name: 'search_recent_tweets',
                args: {
                  lastProcessedId: state.lastProcessedId || undefined,
                },
                id: 'tool_call_id',
                type: 'tool_call',
              },
            ],
          }),
        ],
      });

      const lastMessage = toolResponse.messages[toolResponse.messages.length - 1];

      let searchResult;
      if (typeof lastMessage.content === 'string') {
        try {
          searchResult = JSON.parse(lastMessage.content);
          logger.info('Parsed search result:', searchResult);
        } catch (error) {
          logger.error('Failed to parse search result:', error);
          searchResult = { tweets: [], lastProcessedId: null };
        }
      } else {
        searchResult = lastMessage.content;
        logger.info('Non-string search result:', searchResult);
      }

      const newTweets = [...existingTweets];
      for (const tweet of searchResult.tweets) {
        if (await db.isTweetExists(tweet.id)) {
          continue;
        }
        newTweets.push(tweet);
      }
      const validatedResult = tweetSearchSchema.parse({
        tweets: newTweets,
        lastProcessedId: searchResult.lastProcessedId,
      });

      const chromaService = await ChromaService.getInstance();

      if (validatedResult.tweets.length > 0) {
        await Promise.all(validatedResult.tweets.map(tweet => chromaService.addTweet(tweet)));
      }

      logger.info(`Found ${validatedResult.tweets.length} tweets`);

      return {
        messages: [
          new AIMessage({
            content: JSON.stringify({
              tweets: validatedResult.tweets,
              currentTweetIndex: 0,
              lastProcessedId: validatedResult.lastProcessedId,
            }),
          }),
        ],
        lastProcessedId: validatedResult.lastProcessedId || undefined,
      };
    } catch (error) {
      logger.error('Error in search node:', error);
      const emptyResult = {
        tweets: [],
        lastProcessedId: null,
      };
      return {
        messages: [new AIMessage({ content: JSON.stringify(emptyResult) })],
        lastProcessedId: undefined,
      };
    }
  };
};
