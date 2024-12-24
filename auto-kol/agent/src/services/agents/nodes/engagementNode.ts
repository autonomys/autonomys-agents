import { AIMessage } from '@langchain/core/messages';
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { uploadToDsn } from '../../../utils/dsn.js';
import { getLastDsnCid } from '../../../database/index.js';
import { WorkflowConfig } from '../workflow.js';
import { config as globalConfig } from '../../../config/index.js';
import { ResponseStatus } from '../../../types/queue.js';

const handleSkippedTweet = async (tweet: any, decision: any, config: any) => {
  logger.info('Skipping engagement for tweet', { tweetId: tweet.id, reason: decision.reason });
  await config.toolNode.invoke({
    messages: [
      new AIMessage({
        content: '',
        tool_calls: [
          {
            name: 'queue_skipped',
            args: {
              tweet,
              reason: decision.reason,
              priority: decision.priority || 0,
              workflowState: { decision },
            },
            id: 'skip_call',
            type: 'tool_call',
          },
        ],
      }),
    ],
  });

  if (globalConfig.DSN_UPLOAD) {
    await uploadToDsn({
      data: {
        type: ResponseStatus.SKIPPED,
        tweet,
        decision,
        workflowState: {
          decision,
          toneAnalysis: null,
          responseStrategy: null,
        },
      },
    });
  }
};

export const createEngagementNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Engagement Node - Starting evaluation');
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const parsedContent = parseMessageContent(lastMessage.content);
      const pendingEngagements = parsedContent.pendingEngagements || [];
      logger.info(`Current tweet index: ${parsedContent?.currentTweetIndex}`);

      if (pendingEngagements.length > 0) {
        logger.info(`number of pending engagements: ${pendingEngagements.length}`);
        return {
          messages: [
            new AIMessage({
              content: JSON.stringify({
                tweets: parsedContent.tweets,
                currentTweetIndex: parsedContent.currentTweetIndex,
                batchToAnalyze: pendingEngagements,
                pendingEngagements: [],
                lastProcessedId: parsedContent.lastProcessedId,
                batchProcessing: true,
              }),
            }),
          ],
          processedTweets: state.processedTweets,
        };
      }

      const BATCH_SIZE = globalConfig.ENGAGEMENT_BATCH_SIZE;
      const startIdx = parsedContent.currentTweetIndex || 0;
      const proposedEndIdx = Number(startIdx) + Number(BATCH_SIZE);
      const endIdx = Math.min(proposedEndIdx, parsedContent.tweets?.length || 0);
      const batchTweets = parsedContent.tweets?.slice(startIdx, endIdx) || [];

      logger.info('Processing batch of tweets', {
        batchSize: batchTweets.length,
        startIndex: startIdx,
        endIndex: endIdx,
        totalTweets: parsedContent.tweets.length,
      });

      const processedResults = await Promise.all(
        batchTweets.map(async (tweet: any) => {
          if (state.processedTweets.has(tweet.id)) {
            return { tweet, status: 'alreadyProcessed' };
          }
          const decision = await prompts.engagementPrompt
            .pipe(config.llms.decision)
            .pipe(prompts.engagementParser)
            .invoke({
              tweet: tweet.text,
              thread: tweet.thread || [],
            })
            .catch(error => {
              logger.error('Error in engagement node:', error);
              return {
                shouldEngage: false,
                reason: 'Error in engagement node',
                priority: 0,
                confidence: 0,
              };
            });

          return { tweet, decision, status: 'processing' };
        }),
      );

      const tweetsToEngage = [];
      const newProcessedTweets = new Set<string>(state.processedTweets);

      for (const result of processedResults) {
        newProcessedTweets.add(result.tweet.id);
        if (result.status === 'processing' && result.decision?.shouldEngage) {
          tweetsToEngage.push({
            tweet: result.tweet,
            decision: result.decision,
          });
        } else if (result.status === 'processing') {
          await handleSkippedTweet(result.tweet, result.decision, config);
        }
      }

      return {
        messages: [
          new AIMessage({
            content: JSON.stringify({
              tweets: parsedContent.tweets,
              currentTweetIndex: endIdx,
              pendingEngagements: tweetsToEngage,
              lastProcessedId: parsedContent.lastProcessedId,
              batchProcessing: true,
            }),
          }),
        ],
        processedTweets: newProcessedTweets,
      };
    } catch (error) {
      logger.error('Error in engagement node:', error);
      return { messages: [] };
    }
  };
};
