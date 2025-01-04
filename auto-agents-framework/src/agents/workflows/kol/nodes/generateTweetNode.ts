import {
  DsnData,
  DsnGeneratedTweetData,
  DsnResponseData,
  DsnSkippedEngagementData,
  EngagementDecision,
  WorkflowConfig,
  DsnDataType,
} from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { invokePostTweetTool } from '../../../tools/postTweetTool.js';
import { trendTweetParser, responseParser } from '../prompts.js';
import { AIMessage } from '@langchain/core/messages';
import { summarySchema } from '../schemas.js';
import { z } from 'zod';
import { config as globalConfig } from '../../../../config/index.js';

const logger = createLogger('generate-tweet-node');

const postResponse = async (
  config: WorkflowConfig,
  decision: EngagementDecision,
  summary: z.infer<typeof summarySchema>,
) => {
  const engagementDecision = {
    tweetText: decision.tweet.text,
    reason: decision.decision.reason,
  };
  const response = await config.prompts.responsePrompt
    .pipe(config.llms.generation)
    .pipe(responseParser)
    .invoke({
      decision: engagementDecision,
      thread: decision.tweet.thread,
      patterns: summary.patterns,
      commonWords: summary.commonWords,
    });

  //TODO: After sending the tweet, we need to get the latest tweet, ensure it is the same as we sent and return it
  //This has not been working as expected, so we need to investigate this later
  const _postedResponse = await invokePostTweetTool(
    config.toolNode,
    response.content,
    decision.tweet.id,
  );
  return {
    ...response,
    tweet: decision.tweet,
    engagementDecision,
    //tweetId: tweet ? tweet.id : null
  };
};

const postTweet = async (config: WorkflowConfig, state: typeof State.State) => {
  const recentTweets = Array.from(state.myRecentTweets.values()).map(t => ({
    text: t.text!,
    username: t.username!,
    timeParsed: t.timeParsed!,
  }));

  const lastTweetTime = recentTweets.length > 0 ? recentTweets[0].timeParsed : null;
  const timeSinceLastTweet = lastTweetTime ? new Date().getTime() - lastTweetTime.getTime() : 0;
  const shouldGenerateTweet =
    timeSinceLastTweet === 0 || timeSinceLastTweet > globalConfig.twitterConfig.POST_INTERVAL_MS;
  logger.info('Time since last tweet', {
    timeSinceLastTweet,
    postInterval: globalConfig.twitterConfig.POST_INTERVAL_MS,
    shouldGenerateTweet,
  });

  if (shouldGenerateTweet) {
    const generatedTweet = await config.prompts.tweetPrompt
      .pipe(config.llms.generation)
      .pipe(trendTweetParser)
      .invoke({
        trendAnalysis: state.trendAnalysis,
        recentTweets,
      });

    const postedTweet = await invokePostTweetTool(config.toolNode, generatedTweet.tweet);
    const tweetReceipt = JSON.parse(postedTweet.messages[0].content);
    const postedTweetId = tweetReceipt.postedTweetId;
    return {
      type: DsnDataType.GENERATED_TWEET,
      content: generatedTweet.tweet,
      tweetId: postedTweetId || null,
    } as DsnGeneratedTweetData;
  }
  return undefined;
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
          timeParsed: d.tweet.timeParsed,
          thread: d.tweet.thread,
        },
      }));
    logger.info('Engagement Decisions', {
      shouldEngage: shouldEngage.length,
      shouldNotEngage: shouldNotEngage.length,
    });

    const postedResponses = await Promise.all(
      shouldEngage.map(d => postResponse(config, d, summary)),
    );

    const postedTweet = await postTweet(config, state);

    // Transform the data into an array format expected by DSN
    const formattedDsnData: DsnData[] = [
      ...postedResponses.map(
        response =>
          ({
            type: DsnDataType.RESPONSE,
            tweet: response.tweet,
            content: response.content,
            strategy: response.strategy,
            decision: {
              shouldEngage: true,
              reason: response.engagementDecision.reason,
            },
          }) as DsnResponseData,
      ),
      ...shouldNotEngage.map(
        item =>
          ({
            type: DsnDataType.SKIPPED_ENGAGEMENT,
            decision: item.decision,
            tweet: item.tweet,
          }) as DsnSkippedEngagementData,
      ),
      ...(postedTweet ? [postedTweet] : []),
    ];

    return {
      dsnData: formattedDsnData,
      engagementDecisions: [],
    };
  };
