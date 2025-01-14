import { TwitterApi } from '../src/services/twitter/types.js';
import { createTwitterApi } from '../src/services/twitter/client.js';
import { config } from '../src/config/index.js';
import { createLogger } from '../src/utils/logger.js';
import { SearchMode, Scraper, Tweet } from 'agent-twitter-client';

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

const myMentions = await twitterApi.getMyUnrepliedToMentions(5);
logger.info('My Mentions', { myMentions });


const conversationId = '1874032422175858869';
const tweetId = '1874146661251113110';

// const conversation = await iterateResponse(
//   scraper.searchTweets(`conversation_id:${conversationId}`, 100, SearchMode.Latest),
// );
// const tweet = await scraper.getTweet(tweetId);
// logger.info('Conversation', {
//   tweet: {
//     text: tweet!.text,
//     conversationId: tweet!.conversationId,
//     inReplyToStatusId: tweet!.inReplyToStatusId,
//     id: tweet!.id,
//   },
//   conversation: conversation.map(t => ({
//     text: t.text,
//     username: t.username,
//     conversationId: t.conversationId,
//     id: t.id,
//   })),
// });

// const conversationWithReplies = await iterateResponse(scraper.searchTweets(`to:${twitterApi.username} conversation_id:${conversationId}`, 100, SearchMode.Latest));
// logger.info('Conversation With Replies', { conversationWithReplies: conversationWithReplies.map(t => ({
//     text: t.text,
//     username: t.username,
//     conversationId: t.conversationId,
//     id: t.id,
//   })),
// });


//logger.info('Conversation', { conversation });

//const myMentions = await twitterApi.getMyUnrepliedToMentions(5);
