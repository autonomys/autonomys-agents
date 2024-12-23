import { AIMessage } from "@langchain/core/messages";
import { State, logger, parseMessageContent } from '../workflow.js';
import * as prompts from '../prompts.js';
import { flagBackSkippedTweet, getAllSkippedTweetsToRecheck } from '../../../database/index.js';
import { WorkflowConfig } from '../workflow.js';

export const createRecheckSkippedNode = (config: WorkflowConfig) => {
    return async (state: typeof State.State) => {
        logger.info('Recheck Skipped Node - Reviewing previously skipped tweets');
        try {
            const lastMessage = state.messages[state.messages.length - 1];
            const parsedContent = parseMessageContent(lastMessage.content);
            const {tweets, currentTweetIndex} = parsedContent;
            logger.info(`currentTweetIndex: ${currentTweetIndex}`);
          
            const skippedTweets = await getAllSkippedTweetsToRecheck();

            if (!skippedTweets || skippedTweets.length === 0) {
                logger.info('No skipped tweets to recheck');
                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            fromRecheckNode: true,
                            currentTweetIndex: currentTweetIndex,
                            tweets: tweets,
                            pendingEngagements: [],
                            messages: []
                        })
                    })]
                };
            }

            logger.info(`Found ${skippedTweets.length} skipped tweets to recheck`);

            const processedTweets = [];
            for (const tweet of skippedTweets) {
                const decision = await prompts.engagementPrompt
                    .pipe(config.llms.decision)
                    .pipe(prompts.engagementParser)
                    .invoke({ tweet: tweet.text });

                logger.info('Recheck decision:', { tweetId: tweet.id, decision });

                if (decision.shouldEngage) {
                    processedTweets.push({
                        tweet,
                        decision
                    });
                } else {
                    const flagged = await flagBackSkippedTweet(tweet.id, decision.reason);
                    if (!flagged) {
                        logger.info('Failed to flag back skipped tweet:', { tweetId: tweet.id });
                    }
                }
            }

            if (processedTweets.length === 0) {
                logger.info('No skipped tweets passed recheck');
                return {
                    messages: [new AIMessage({
                        content: JSON.stringify({
                            fromRecheckNode: true,
                            currentTweetIndex: currentTweetIndex,
                            tweets: tweets,
                            pendingEngagements: [],
                            messages: []
                        })
                    })]
                };
            }

            const { tweet, decision } = processedTweets[0];

            return {
                messages: [new AIMessage({
                    content: JSON.stringify({
                        tweets: [tweet],
                        currentTweetIndex: 0,
                        tweet,
                        decision
                    })
                })]
            };
        } catch (error) {
            logger.error('Error in recheck skipped node:', error);
            return { messages: [] };
        }
    }
}