import { MessageContent } from '@langchain/core/messages';
import { parseMessageContent } from '../../../workflows/utils.js';
import { Tweet } from '../../../../services/twitter/types.js';
import { createLogger } from '../../../../utils/logger.js';

const logger = createLogger('convert-tweet-messages');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const convertTweet = (tweet: any): Tweet | null => {
  if (!tweet || typeof tweet !== 'object') {
    logger.warn('Invalid tweet object received:', tweet);
    return null;
  }
  try {
    return {
      ...tweet,
      timeParsed: tweet.timestamp ? new Date(tweet.timestamp * 1000) : new Date(),
    };
  } catch (error) {
    logger.error('Error converting tweet:', error);
    return null;
  }
};

export const convertMessageContentToTweets = (messageContent: MessageContent): Tweet[] => {
  try {
    const parsedContent = parseMessageContent(messageContent);

    // Check if parsedContent has tweets property and it's an array
    if (!parsedContent?.tweets || !Array.isArray(parsedContent.tweets)) {
      logger.warn('No valid tweets array found in message content');
      return [];
    }

    return parsedContent.tweets
      .map((tweet: any) => convertTweet(tweet)) // eslint-disable-line @typescript-eslint/no-explicit-any
      .filter((tweet: Tweet | null): tweet is Tweet => tweet !== null);
  } catch (error) {
    logger.error('Error converting message content to tweets:', error);
    return [];
  }
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
