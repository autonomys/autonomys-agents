import { TwitterApi } from '../src/services/twitter/types.js';
import { createTwitterApi } from '../src/services/twitter/client.js';
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

const myRecentTweets = await twitterApi.getMyRecentTweets(10);
logger.info('My Recent Tweets', { myRecentTweets: myRecentTweets });
//const followingRecents = await twitterApi.getFollowingRecentTweets(50, 10);
//logger.info('Following Recents', { followingRecents: followingRecents.length });
