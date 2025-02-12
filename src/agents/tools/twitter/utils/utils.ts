import { Tweet } from '../../../../services/twitter/types.js';
import { createLogger } from '../../../../utils/logger.js';

export const logger = createLogger('twitter-tools');

export type MinimalTweet = {
  id?: string;
  username?: string;
  text?: string;
  createdAt?: string;
  inReplyToStatusId?: string;
  thread?: MinimalTweet[];
  quotedStatusId?: string;
  quotedStatus?: MinimalTweet;
};

export const tweetToMinimalTweet = (tweet: Tweet): MinimalTweet => {
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

export const cleanTweetForCircularReferences = (tweet: Tweet): Tweet => ({
  ...tweet,
  thread: tweet.thread
    ?.filter(t => t.id !== tweet.id)
    .map(t => ({
      id: t.id,
      text: t.text,
      username: t.username,
      timeParsed: t.timeParsed,
    })) as Tweet[],
  inReplyToStatus: undefined,
  quotedStatus: undefined,
  retweetedStatus: undefined,
});
