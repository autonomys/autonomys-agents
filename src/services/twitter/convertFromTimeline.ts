/* eslint-disable @typescript-eslint/no-explicit-any */
import { Tweet } from './types.js';

// Type guards
export const isValidTweet = (tweet: any): boolean => {
  const tweetData = tweet?.tweet || tweet;

  return (
    tweetData &&
    (tweetData.__typename === 'Tweet' || tweetData.__typename === 'TweetWithVisibilityResults') &&
    (tweetData.legacy ||
      tweetData.quoted_status_result?.result?.legacy ||
      tweetData.retweeted_status_result?.result?.legacy ||
      tweetData.note_tweet?.note_tweet_results?.result?.text)
  );
};

// Pure functions for data extraction
const extractLegacyData = (tweet: any) => {
  const tweetData = tweet?.tweet || tweet;

  if (tweetData.note_tweet?.note_tweet_results?.result?.text) {
    return {
      ...tweetData.legacy,
      full_text: tweetData.note_tweet.note_tweet_results.result.text,
    };
  }

  return (
    tweetData.legacy ||
    tweetData.quoted_status_result?.result?.legacy ||
    tweetData.retweeted_status_result?.result?.legacy
  );
};

const extractFullText = (tweet: any): string => {
  // Check for note_tweet (long post) first
  if (tweet.note_tweet?.note_tweet_results?.result?.text) {
    return tweet.note_tweet.note_tweet_results.result.text;
  }

  const legacy = extractLegacyData(tweet);
  return legacy?.full_text || legacy?.text || '';
};

const extractQuotedTweet = (tweet: any): Tweet | undefined => {
  const quotedTweet = tweet.quoted_status_result?.result;
  if (!quotedTweet) return undefined;

  return convertTimelineTweetToTweet(quotedTweet);
};

const extractPhotos = (media: any[] = []) =>
  media
    .filter((m: any) => m.type === 'photo')
    .map((p: any) => ({
      url: p.media_url_https,
      width: p.sizes?.large?.w,
      height: p.sizes?.large?.h,
    }));

const extractVideos = (media: any[] = []) =>
  media
    .filter((m: any) => m.type === 'video' || m.type === 'animated_gif')
    .map((v: any) => ({
      url: v.media_url_https,
      duration: v.video_info?.duration_millis,
      variants: v.video_info?.variants,
    }));

const extractUrls = (entities: any) =>
  entities?.urls?.map((u: any) => ({
    url: u.url,
    expandedUrl: u.expanded_url,
    displayUrl: u.display_url,
  })) || [];

const extractUserData = (tweet: any) => {
  const userData = tweet.core?.user_results?.result?.legacy;
  const legacy = extractLegacyData(tweet);
  return {
    userId: legacy?.user_id_str || userData?.id_str,
    username: userData?.screen_name,
    displayName: userData?.name,
    profileImageUrl: userData?.profile_image_url_https,
  };
};

export const convertTimelineTweetToTweet = (tweet: any): Tweet => {
  const legacy = extractLegacyData(tweet);

  const media = legacy.extended_entities?.media || legacy.entities?.media || [];
  const userData = extractUserData(tweet);
  const quotedTweet = extractQuotedTweet(tweet);

  return {
    id: tweet.rest_id || legacy.id_str,
    userId: userData.userId,
    username: userData.username,
    displayName: userData.displayName,
    profileImageUrl: userData.profileImageUrl,
    text: extractFullText(tweet),
    timeParsed: new Date(legacy.created_at),
    hashtags: legacy.entities?.hashtags || [],
    mentions: legacy.entities?.user_mentions || [],
    photos: extractPhotos(media),
    videos: extractVideos(media),
    urls: extractUrls(legacy.entities),
    ...(tweet.thread && { thread: tweet.thread }),
    ...(quotedTweet && { quotedStatus: quotedTweet }),
    conversationId: legacy.conversation_id_str,
    inReplyToStatusId: legacy.in_reply_to_status_id_str,
    replyCount: legacy.reply_count,
    retweetCount: legacy.retweet_count,
    likeCount: legacy.favorite_count,
    viewCount: tweet.views?.count,
  };
};
