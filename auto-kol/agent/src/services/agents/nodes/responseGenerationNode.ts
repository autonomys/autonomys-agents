import { AIMessage } from '@langchain/core/messages';
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { WorkflowConfig } from '../workflow.js';
import { ResponseStatus } from '../../../types/queue.js';

export const createResponseGenerationNode = (config: WorkflowConfig) => {
  return async (state: typeof State.State) => {
    logger.info('Response Generation Node - Creating response strategy');
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      const parsedContent = parseMessageContent(lastMessage.content);
      const batchToRespond = parsedContent.batchToRespond || [];
      const batchToFeedback: any[] = [];

      logger.info(`Processing batch of ${batchToRespond.length} tweets for response generation`, {
        hasRejectedResponses: parsedContent.fromAutoApproval,
      });

      await Promise.all(
        batchToRespond.map(async (item: any) => {
          const { tweet, decision, toneAnalysis, workflowState } = item;
          logger.info('Processing tweet:', {
            id: tweet.id,
            author: tweet.author_username,
          });

          if (!workflowState) {
            item.workflowState = { autoFeedback: [] };
          } else if (!workflowState.autoFeedback) {
            workflowState.autoFeedback = [];
          }

          if (parsedContent.fromAutoApproval) {
            item.retry = (item.retry || 0) + 1;
            logger.info('Regenerating response due to rejection:', {
              retry: item.retry,
            });
          } else {
            item.retry = 0;
          }

          const lastFeedback = workflowState?.autoFeedback[workflowState?.autoFeedback.length - 1];
          const rejectionInstructions = lastFeedback
            ? prompts.formatRejectionInstructions(lastFeedback.reason)
            : '';
          const rejectionFeedback = lastFeedback
            ? prompts.formatRejectionFeedback(lastFeedback.reason, lastFeedback.suggestedChanges)
            : '';

          const similarTweetsResponse = await config.toolNode.invoke({
            messages: [
              new AIMessage({
                content: '',
                tool_calls: [
                  {
                    name: 'search_similar_tweets',
                    args: {
                      query: `author:${tweet.author_username} ${tweet.text}`,
                      k: 5,
                    },
                    id: 'similar_tweets_call',
                    type: 'tool_call',
                  },
                ],
              }),
            ],
          });

          const similarTweets = parseMessageContent(
            similarTweetsResponse.messages[similarTweetsResponse.messages.length - 1].content,
          );
          const responseStrategy = await prompts.responsePrompt
            .pipe(config.llms.response)
            .pipe(prompts.responseParser)
            .invoke({
              tweet: tweet.text,
              tone: toneAnalysis?.suggestedTone || workflowState?.toneAnalysis?.suggestedTone,
              author: tweet.author_username,
              similarTweets: JSON.stringify(similarTweets.similar_tweets),
              thread: JSON.stringify(tweet.thread || []),
              previousResponse:
                workflowState?.autoFeedback[workflowState?.autoFeedback.length - 1]?.response || '',
              rejectionFeedback,
              rejectionInstructions,
            });

          logger.info('Response strategy:', {
            content: responseStrategy.content,
            tone: responseStrategy.tone,
            strategy: responseStrategy.strategy,
          });

          const data = {
            type: ResponseStatus.PENDING,
            tweet,
            response: responseStrategy.content,
            workflowState: {
              decision: decision || workflowState?.decision,
              toneAnalysis: toneAnalysis || workflowState?.toneAnalysis,
              responseStrategy: {
                tone: responseStrategy.tone,
                strategy: responseStrategy.strategy,
                referencedTweets: responseStrategy.referencedTweets,
                confidence: responseStrategy.confidence,
              },
              autoFeedback: workflowState?.autoFeedback || [],
            },
            retry: item.retry,
          };
          batchToFeedback.push(data);

          const args = {
            tweet,
            response: responseStrategy.content,
            workflowState: {
              toneAnalysis: toneAnalysis,
              responseStrategy,
              thread: tweet.thread || [],
              similarTweets: similarTweets.similar_tweets,
            },
          };
          if (!parsedContent.fromAutoApproval) {
            const addResponse = await config.toolNode.invoke({
              messages: [
                new AIMessage({
                  content: '',
                  tool_calls: [
                    {
                      name: 'add_response',
                      args,
                      id: 'add_response_call',
                      type: 'tool_call',
                    },
                  ],
                }),
              ],
            });
            return addResponse;
          } else {
            const updateResponse = await config.toolNode.invoke({
              messages: [
                new AIMessage({
                  content: '',
                  tool_calls: [
                    {
                      name: 'update_response',
                      args,
                      id: 'update_response_call',
                      type: 'tool_call',
                    },
                  ],
                }),
              ],
            });
            return updateResponse;
          }
        }),
      );

      return {
        messages: [
          new AIMessage({
            content: JSON.stringify({
              tweets: parsedContent.tweets,
              currentTweetIndex: parsedContent.currentTweetIndex,
              pendingEngagements: parsedContent.pendingEngagements,
              lastProcessedId: parsedContent.lastProcessedId,
              batchToFeedback: batchToFeedback,
            }),
          }),
        ],
        processedTweets: new Set(batchToRespond.map((item: any) => item.tweet.id)),
      };
    } catch (error) {
      logger.error('Error in response generation node:', error);
      return { messages: [] };
    }
  };
};
