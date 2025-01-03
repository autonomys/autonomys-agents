import {
  DsnData,
  DsnGeneratedTweetData,
  DSNResponseData,
  DsnSkippedEngagementData,
  EngagementDecision,
  WorkflowConfig,
  dsnDataType,
} from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { invokePostTweetTool } from '../../../tools/postTweetTool.js';
import { trendTweetParser, responseParser } from '../prompts.js';
import { AIMessage } from '@langchain/core/messages';
import { summarySchema } from '../schemas.js';
import { z } from 'zod';
const logger = createLogger('generate-tweet-node');

const postResponse = async (
  config: WorkflowConfig,
  decision: EngagementDecision,
  summary: z.infer<typeof summarySchema>,
) => {
  const thread =
    decision.tweet.thread && decision.tweet.thread.length > 0
      ? decision.tweet.thread.map(t => ({ text: t.text, username: t.username }))
      : 'No thread';
  const engagementDecision = { 
    tweetText: decision.tweet.text, 
    reason: decision.decision.reason,
  };
  const response = await config.prompts.responsePrompt
    .pipe(config.llms.generation)
    .pipe(responseParser)
    .invoke({
      decision: engagementDecision,
      thread,
      patterns: summary.patterns,
      commonWords: summary.commonWords,
    });
  //TODO: After sending the tweet, we need to get the latest tweet, ensure it is the same as we sent and return it
  //This has not been working as expected, so we need to investigate this later
  const postedResponse = await invokePostTweetTool(config.toolNode, response.content, decision.tweet.id);
  return {
    ...response,
    tweet: decision.tweet,
    engagementDecision,
    //tweetId: tweet ? tweet.id : null
  };
};

export const createGenerateTweetNode =
  (config: WorkflowConfig) => async (state: typeof State.State) => {
    logger.info('Generate Tweet Node - Generating tweets');

    if (!state.trendAnalysis || !state.trendAnalysis.trends.length) {
      logger.error('Missing trend analysis in state');
      return {
        messages: [new AIMessage({ content: JSON.stringify({ error: 'Missing trend analysis' }) })],
      };
    }

    const recentTweets = Array.from(state.myRecentTweets.values()).map(t => ({
      text: t.text!,
      username: t.username!,
    }));
    const summary = state.summary;

    const shouldEngage = state.engagementDecisions.filter(d => d.decision.shouldEngage);
    const shouldNotEngage = state.engagementDecisions
      .filter(d => !d.decision.shouldEngage)
      .map(d => ({
        decision: d.decision,
        tweet: {
          id: d.tweet.id,
          text: d.tweet.text,
          username: d.tweet.username,
          thread: d.tweet.thread
            ? d.tweet.thread.map(t => ({ id: t.id, text: t.text, username: t.username }))
            : 'No thread',
        },
      }));
    logger.info('Engagement Decisions', {
      shouldEngage: shouldEngage.length,
      shouldNotEngage: shouldNotEngage.length,
    });

    const postedResponses = await Promise.all(
      shouldEngage.map(d => postResponse(config, d, summary)),
    );

    // Generate a top level tweet
    //TODO: add a check to see if it has been long enough since the last tweet
    const generatedTweet = await config.prompts.tweetPrompt
      .pipe(config.llms.generation)
      .pipe(trendTweetParser)
      .invoke({
        trendAnalysis: state.trendAnalysis,
        recentTweets,
      });

    const postedTweet = await invokePostTweetTool(config.toolNode, generatedTweet.tweet);

    // Transform the data into an array format expected by DSN
    const formattedDsnData: DsnData[] = [
      ...postedResponses.map(
        response =>
          ({
            type: dsnDataType.RESPONSE,
            tweet: response.tweet,
            content: response.content,
            strategy: response.strategy,
            decision: {
              shouldEngage: true,
              reason: response.engagementDecision.reason
            },
          }) as DSNResponseData,
      ),
      ...shouldNotEngage.map(
        item =>
          ({
            type: dsnDataType.SKIPPED_ENGAGEMENT,
            decision: item.decision,
            tweet: item.tweet,
          }) as DsnSkippedEngagementData,
      ),
      {
        type: dsnDataType.GENERATED_TWEET,
        content: generatedTweet.tweet,
        tweetId: postedTweet ? postedTweet.postedTweetId : null,
      } as DsnGeneratedTweetData,
    ];

    return {
      dsnData: formattedDsnData,
      engagementDecisions: [],
    };
  };
