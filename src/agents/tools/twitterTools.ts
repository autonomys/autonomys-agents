import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createLogger } from '../../utils/logger.js';
import { Tweet, TwitterApi } from '../../services/twitter/types.js';
import { cleanTweetForCircularReferences } from './twitter/utils/twitter.js';
import { config } from '../../config/index.js';

const logger = createLogger('fetch-timeline-tool');

type MinimalTweet = {
  id?: string;
  username?: string;
  text?: string;
  createdAt?: string;
  inReplyToStatusId?: string;
  thread?: MinimalTweet[];
  quotedStatusId?: string;
  quotedStatus?: MinimalTweet;
};

const tweetToMinimalTweet = (tweet: Tweet): MinimalTweet => {
  const quotedStatus = tweet.quotedStatus ? tweetToMinimalTweet(tweet.quotedStatus) : undefined;
  const thread = tweet.thread ? tweet.thread.map(t => tweetToMinimalTweet(t)) : undefined;

  return {
    id: tweet.id,
    username: tweet.username,
    text: tweet.text,
    createdAt: tweet.timeParsed?.toString(),
    inReplyToStatusId: tweet.inReplyToStatusId,
    thread,
    quotedStatusId: tweet.quotedStatusId,
    quotedStatus,
  };
};

export const createFetchTimelineTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_timeline',
    description:
      'Fetch my timeline to get recent tweets by those I follow or who the algorithm is showing me',
    schema: z.object({
      processedIds: z.array(z.string()),
      numTimelineTweets: z.number(),
    }),
    func: async ({
      processedIds,
      numTimelineTweets,
    }: {
      processedIds: string[];
      numTimelineTweets: number;
    }) => {
      try {
        const myTimelineTweets = await twitterApi.getMyTimeline(numTimelineTweets, processedIds);
        const tweets = {
          timelineTweets:
            // the twitter api does not respect the count parameter so randomly sorting and slicing
            (myTimelineTweets.length > numTimelineTweets
              ? myTimelineTweets.sort((_a, _b) => Math.random() - 0.5).slice(0, numTimelineTweets)
              : myTimelineTweets
            ).map(t => tweetToMinimalTweet(t)),
        };
        logger.info('Timeline tweets:', {
          timelineTweets: tweets.timelineTweets.length,
        });
        return { tweets };
      } catch (error) {
        logger.error('Error in fetchTimelineTool:', error);
        return {
          tweets: {
            timelineTweets: [],
          },
        };
      }
    },
  });

export const createFetchMentionsTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_mentions',
    description: 'Fetch recent tweets that mention me',
    schema: z.object({ maxMentions: z.number() }),
    func: async ({ maxMentions }: { maxMentions: number }) => {
      try {
        const recentMentions = await twitterApi.getMyUnrepliedToMentions(maxMentions);
        return {
          mentions: recentMentions.map(t => {
            const tweet = cleanTweetForCircularReferences(t);
            return tweetToMinimalTweet(tweet);
          }),
        };
      } catch (error) {
        logger.error('Error in fetchMentionsTool:', error);
        return {
          tweets: [],
        };
      }
    },
  });

export const createFetchMyRecentTweetsAndRepliesTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_my_recent_tweets_and_replies',
    description: 'Fetch my recent tweets and replies',
    schema: z.object({ maxMyRecentTweets: z.number(), maxMyRecentReplies: z.number() }),
    func: async ({
      maxMyRecentTweets,
      maxMyRecentReplies,
    }: {
      maxMyRecentTweets: number;
      maxMyRecentReplies: number;
    }) => {
      try {
        const myRecentTweets = await twitterApi.getMyRecentTweets(maxMyRecentTweets);
        const myRecentReplies = await twitterApi.getMyRecentReplies(maxMyRecentReplies);
        logger.info('Fetch My Recent Tweets Tool - Result', {
          tweets: myRecentTweets.length,
        });

        return {
          myTweets: myRecentTweets.map(t => tweetToMinimalTweet(t)),
          myReplies: myRecentReplies.map(t => tweetToMinimalTweet(t)),
        };
      } catch (error) {
        logger.error('Error in fetchRecentTweetsTool:', error);
        return {
          tweets: [],
        };
      }
    },
  });

export const createPostTweetTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'post_tweet',
    description: 'Post a tweet',
    schema: z.object({ tweet: z.string(), inReplyTo: z.string().optional() }),
    func: async ({ tweet, inReplyTo }: { tweet: string; inReplyTo?: string }) => {
      try {
        if (config.twitterConfig.POST_TWEETS) {
          const postedTweet = await twitterApi
            .sendTweet(tweet, inReplyTo)
            .then(_ =>
              !inReplyTo ? twitterApi.scraper.getLatestTweet(twitterApi.username) : undefined,
            );

          logger.info('Tweet posted successfully', {
            postedTweet: { id: postedTweet?.id, text: postedTweet?.text },
          });
          return {
            postedTweet: true,
            postedTweetId: postedTweet?.id,
          };
        } else {
          logger.info('Tweet not posted', { tweet });
          return {
            postedTweet: false,
            message:
              'The posting of tweets is disabled for testing purposes. Continue as if it was enabled',
          };
        }
      } catch (error) {
        logger.error('Error posting tweet:', error);
        return {
          postedTweet: false,
        };
      }
    },
  });

export const createAllTwitterTools = (twitterApi: TwitterApi) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterApi);
  const fetchMentionsTool = createFetchMentionsTool(twitterApi);
  const fetchMyRecentTweetsAndRepliesTool = createFetchMyRecentTweetsAndRepliesTool(twitterApi);
  const postTweetTool = createPostTweetTool(twitterApi);

  return {
    fetchTimelineTool,
    fetchMentionsTool,
    fetchMyRecentTweetsAndRepliesTool,
    postTweetTool,
    tools: [fetchTimelineTool, fetchMentionsTool, fetchMyRecentTweetsAndRepliesTool, postTweetTool],
  };
};
