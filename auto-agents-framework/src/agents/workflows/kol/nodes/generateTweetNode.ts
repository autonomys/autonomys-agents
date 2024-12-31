import { EngagementDecision, WorkflowConfig } from '../types.js';
import { createLogger } from '../../../../utils/logger.js';
import { State } from '../workflow.js';
import { invokePostTweetTool } from '../../../tools/postTweetTool.js';
import { tweetPrompt, trendTweetParser, responsePrompt, responseParser } from '../prompts.js';
import { AIMessage } from '@langchain/core/messages';

const logger = createLogger('generate-tweet-node');

const postResponse = async (
  config: WorkflowConfig,
  decision: EngagementDecision,
  recentTweets: { text: string; username: string }[],
) => {
  const thread =
    decision.tweet.thread && decision.tweet.thread.length > 0
      ? decision.tweet.thread.map(t => ({ text: t.text, username: t.username }))
      : 'No thread';
  const decisionInfo = { tweet: decision.tweet.text, reason: decision.decision.reason };
  const response = await responsePrompt.pipe(config.llms.generation).pipe(responseParser).invoke({
    decision: decisionInfo,
    thread,
    recentTweets,
  });
  const tweet = await invokePostTweetTool(config.toolNode, response.content);
  return { ...response, tweetId: tweet ? tweet.id : null };
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
      shouldEngage.map(d => postResponse(config, d, recentTweets)),
    );

    // Generate a top level tweet TODO: add a check to see if it has been long enough since the last tweet
    const generatedTweet = await tweetPrompt
      .pipe(config.llms.generation)
      .pipe(trendTweetParser)
      .invoke({
        trendAnalysis: state.trendAnalysis,
        recentTweets,
      });
    const postedTweet = await invokePostTweetTool(config.toolNode, generatedTweet.tweet);

    // Transform the data into an array format expected by DSN
    const formattedDsnData = [
      ...postedResponses.map(response => ({
        type: 'response',
        content: response.content,
        tweetId: response.tweetId,
        strategy: response.strategy,
      })),
      ...shouldNotEngage.map(item => ({
        type: 'skipped_engagement',
        decision: item.decision,
        tweet: item.tweet,
      })),
      {
        type: 'generated_tweet',
        content: generatedTweet.tweet,
        tweetId: postedTweet ? postedTweet.id : null,
      },
    ];

    return {
      messages: [new AIMessage({ content: JSON.stringify(formattedDsnData) })],
      dsnData: formattedDsnData,
      engagementDecisions: [],
    };
  };
