import { TwitterApi, createTwitterApi } from '../src/services/twitter/client.js';
import { config } from '../src/config/index.js';
import { createLogger } from '../src/utils/logger.js';

const logger = createLogger('twitter', './examples/logs');

const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;

const twitterApi: TwitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
const { scraper } = twitterApi;

// const myMentions = await twitterApi.getMyMentions(5);
// logger.info('My Mentions', { myMentions });

const iterateResponse = async <T>(response: AsyncGenerator<T>): Promise<T[]> => {
  const tweets: T[] = [];
  for await (const tweet of response) {
    tweets.push(tweet);
  }
  return tweets;
};

const following = await twitterApi.getFollowingRecentTweets(100, 10);

logger.info('Following', { following: following.length });
//const followingRecents = await twitterApi.getFollowingRecentTweets(50, 10);
//logger.info('Following Recents', { followingRecents: followingRecents.length });
