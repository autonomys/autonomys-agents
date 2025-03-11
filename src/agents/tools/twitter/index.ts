import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { TwitterApi } from '../../../services/twitter/types.js';
import { cleanTweetForCircularReferences, tweetToMinimalTweet } from './utils/utils.js';
import { createLogger } from '../../../utils/logger.js';

export const logger = createLogger('twitter-tools');

export const createFetchTimelineTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_timeline',
    description:
      'Fetch my timeline to get recent tweets by those I follow or who the algorithm is showing me',
    schema: z.object({
      processedIds: z.array(z.string()),
      numTimelineTweets: z.number().default(10),
    }),
    func: async ({
      processedIds,
      numTimelineTweets,
    }: {
      processedIds: string[];
      numTimelineTweets: number;
    }) => {
      try {
        const myReplies = await twitterApi.getMyRepliedToIds();
        const tweets = (
          await twitterApi.getMyTimeline(numTimelineTweets, [...processedIds, ...myReplies])
        ).map(t => tweetToMinimalTweet(t));

        logger.info('Timeline tweets:', {
          timelineTweets: tweets.length,
        });
        return { tweets };
      } catch (error) {
        logger.error('Error in fetchTimelineTool:', error);
        return {
          tweets: [],
        };
      }
    },
  });

export const createFetchFollowingTimelineTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_following_timeline',
    description: 'Fetch recent tweets only from those I follow',
    schema: z.object({
      numFollowingTimelineTweets: z.number().default(10),
      processedIds: z.array(z.string()),
    }),
    func: async ({
      numFollowingTimelineTweets,
      processedIds,
    }: {
      numFollowingTimelineTweets: number;
      processedIds: string[];
    }) => {
      const myReplies = await twitterApi.getMyRepliedToIds();
      logger.info('myReplies', { myReplies });
      const tweets = (
        await twitterApi.getFollowingTimeline(numFollowingTimelineTweets, [
          ...processedIds,
          ...myReplies,
        ])
      ).map(t => tweetToMinimalTweet(t));
      return { tweets };
    },
  });

export const createFetchMentionsTool = (twitterApi: TwitterApi, maxThreadDepth: number) =>
  new DynamicStructuredTool({
    name: 'fetch_mentions',
    description: 'Fetch recent tweets that mention me',
    schema: z.object({ maxMentions: z.number().default(10) }),
    func: async ({ maxMentions }: { maxMentions: number }) => {
      try {
        const recentMentions = await twitterApi.getMyUnrepliedToMentions(
          maxMentions,
          maxThreadDepth,
        );
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
    description:
      'Fetch recent tweets and replies you have posted. This is useful to gain context on what you have recently been discussing.',
    schema: z.object({
      maxMyRecentTweets: z.number().default(10),
      maxMyRecentReplies: z.number().default(10),
    }),
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

export const createFetchFollowingTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_following',
    description: 'Fetch the following of a given Twitter user',
    schema: z.object({ username: z.string(), numFollowing: z.number().default(10) }),
    func: async ({ username, numFollowing }: { username: string; numFollowing: number }) => {
      const following = await twitterApi.getFollowing(username, numFollowing);
      return { following };
    },
  });

export const createFetchProfileTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_profile',
    description: 'Fetch the profile of a given Twitter user',
    schema: z.object({ username: z.string() }),
    func: async ({ username }: { username: string }) => {
      const profile = await twitterApi.getProfile(username);
      return { profile };
    },
  });

export const createFetchTweetTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'fetch_tweet',
    description: 'Fetch a tweet by its ID',
    schema: z.object({ tweetId: z.string() }),
    func: async ({ tweetId }: { tweetId: string }) => {
      const tweet = await twitterApi.getTweet(tweetId);
      return { tweet };
    },
  });

export const createSearchTweetsTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'search_tweets',
    description: 'Search for tweets by a given query',
    schema: z.object({ query: z.string(), count: z.number().default(10) }),
    func: async ({ query, count }: { query: string; count: number }) => {
      const tweets = await twitterApi.searchTweets(query, count);
      return { tweets: tweets.map(t => tweetToMinimalTweet(t)) };
    },
  });

export const createLikeTweetTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'like_tweet',
    description:
      'Like a tweet that you find interesting and is aligned with your conviction, regardless if you respond to it or not',
    schema: z.object({ tweetId: z.string() }),
    func: async ({ tweetId }: { tweetId: string }) => {
      try {
        await twitterApi.likeTweet(tweetId);
        return {
          liked: true,
          tweetId,
        };
      } catch (error) {
        logger.error('Error liking tweet:', error);
        return {
          liked: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });

export const createPostTweetTool = (twitterApi: TwitterApi, postTweets: boolean = false) =>
  new DynamicStructuredTool({
    name: 'post_tweet',
    description: 'Post a tweet',
    schema: z.object({ text: z.string(), inReplyTo: z.string().optional() }),
    func: async ({ text, inReplyTo }: { text: string; inReplyTo?: string }) => {
      try {
        if (postTweets) {
          if (inReplyTo) {
            const myReplies = await twitterApi.getMyRepliedToIds();
            const hasRepliedTo = myReplies.includes(inReplyTo);
            if (hasRepliedTo) {
              logger.info('Already replied to this tweet', { inReplyTo });
              return {
                postedTweet: false,
                message: 'Already replied to this tweet',
              };
            }
          }
          const postedTweetId = await twitterApi.sendTweet(text, inReplyTo);
          logger.info('Tweet posted successfully', {
            postedTweet: { postedTweetId, text },
          });
          return {
            postedTweet: true,
            postedTweetId,
            inReplyTo,
          };
        } else {
          logger.info('Tweet not posted', { text });
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

export const createQuoteTweetTool = (twitterApi: TwitterApi, postTweets: boolean = false) =>
  new DynamicStructuredTool({
    name: 'quote_tweet',
    description: 'Quote a tweet',
    schema: z.object({
      quoteTweetId: z.string().describe('The ID of the tweet you want to quote'),
      text: z.string().describe('The text you want to quote the tweet with'),
    }),
    func: async ({ quoteTweetId, text }: { quoteTweetId: string; text: string }) => {
      try {
        if (postTweets) {
          const postedTweetId = await twitterApi.quoteTweet(text, quoteTweetId);
          return {
            quoted: true,
            quoteTweetId,
            text,
            postedTweetId,
          };
        } else {
          logger.info('Quote tweet not posted', { text, quoteTweetId });
          return {
            quoted: false,
            message:
              'The posting of tweets is disabled for testing purposes. Continue as if it was enabled',
          };
        }
      } catch (error) {
        logger.error('Error quoting tweet:', error);
        return {
          quoted: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });

export const createFollowUserTool = (twitterApi: TwitterApi) =>
  new DynamicStructuredTool({
    name: 'follow_user',
    description: 'Follow a user that you find worthy of following and engaging with.',
    schema: z.object({ username: z.string() }),
    func: async ({ username }: { username: string }) => {
      try {
        await twitterApi.followUser(username);
        return {
          followed: true,
          username,
        };
      } catch (error) {
        logger.error('Error following user:', error);
        return {
          followed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
  });

export const createAllTwitterTools = (
  twitterApi: TwitterApi,
  maxThreadDepth: number,
  postTweets: boolean = false,
) => {
  const fetchTimelineTool = createFetchTimelineTool(twitterApi);
  const fetchFollowingTimelineTool = createFetchFollowingTimelineTool(twitterApi);
  const fetchMentionsTool = createFetchMentionsTool(twitterApi, maxThreadDepth);
  const fetchMyRecentTweetsAndRepliesTool = createFetchMyRecentTweetsAndRepliesTool(twitterApi);
  const searchTweetsTool = createSearchTweetsTool(twitterApi);
  const fetchTweetTool = createFetchTweetTool(twitterApi);
  const postTweetTool = createPostTweetTool(twitterApi, postTweets);
  const quoteTweetTool = createQuoteTweetTool(twitterApi, postTweets);
  const likeTweetTool = createLikeTweetTool(twitterApi);
  const followUserTool = createFollowUserTool(twitterApi);
  const fetchProfileTool = createFetchProfileTool(twitterApi);
  const fetchFollowingTool = createFetchFollowingTool(twitterApi);

  return [
    fetchTimelineTool,
    fetchFollowingTimelineTool,
    fetchMentionsTool,
    fetchMyRecentTweetsAndRepliesTool,
    searchTweetsTool,
    fetchTweetTool,
    fetchProfileTool,
    fetchFollowingTool,
    postTweetTool,
    likeTweetTool,
    followUserTool,
    quoteTweetTool,
  ];
};
