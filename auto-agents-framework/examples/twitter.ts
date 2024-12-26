import { TwitterAPI, createTwitterAPI } from '../src/services/twitter/client.js';
import { config } from '../src/config/index.js';
import { createLogger } from '../src/utils/logger.js';

const logger = createLogger('twitter', './examples/logs');

const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;

const twitterAPI: TwitterAPI = await createTwitterAPI(USERNAME, PASSWORD, COOKIES_PATH);
const { scraper } = twitterAPI;

// const myMentions = await twitterAPI.getMyMentions(5);
// logger.info('My Mentions', { myMentions });

const iterateResponse = async <T>(response: AsyncGenerator<T>): Promise<T[]> => {
  const tweets: T[] = [];
  for await (const tweet of response) {
    tweets.push(tweet);
  }
  return tweets;
};

// const userId = await scraper.getUserIdByScreenName(USERNAME);
// const myPostsIterator = scraper.getTweetsByUserId(userId, 5);
// const myPosts = await iterateResponse(myPostsIterator);
// logger.info('My Posts', { myPosts });

const trends = await scraper.getTrends();
logger.info('Trends', { trends });
