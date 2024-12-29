import { MessageContent } from '@langchain/core/messages';
import { parseMessageContent } from '../../workflows/utils.js';
import { Tweet } from '../../../services/twitter/types.js';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('convert-tweet-messages');

const convertTweet = (tweet: any): Tweet => {
  return {
    ...tweet,
    timeParsed: new Date(tweet.timestamp),
  };
};

export const convertMessageContentToTweets = (messageContent: MessageContent): Tweet[] => {
  const parsedContent = parseMessageContent(messageContent);

  // Check if parsedContent has tweets property and it's an array
  if (!parsedContent?.tweets || !Array.isArray(parsedContent.tweets)) {
    return [];
  }

  return parsedContent.tweets.map((tweet: any) => convertTweet(tweet));
};
