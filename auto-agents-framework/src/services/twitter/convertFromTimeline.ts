import { Tweet } from './types.js';

// Type guards
export const isValidTweet = (tweet: any): boolean =>
  tweet &&
  tweet.__typename === 'Tweet' &&
  (tweet.legacy ||
    tweet.quoted_status_result?.result?.legacy ||
    tweet.retweeted_status_result?.result?.legacy);

// Pure functions for data extraction
const extractLegacyData = (tweet: any) =>
  tweet.legacy ||
  tweet.quoted_status_result?.result?.legacy ||
  tweet.retweeted_status_result?.result?.legacy;

const extractPhotos = (media: any[]) =>
  media
    .filter((m: any) => m.type === 'photo')
    .map((p: any) => ({
      url: p.media_url_https,
      width: p.sizes?.large?.w,
      height: p.sizes?.large?.h,
    }));

const extractVideos = (media: any[]) =>
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
  return {
    userId: tweet.legacy?.user_id_str,
    username: userData?.screen_name,
    displayName: userData?.name,
  };
};

export const convertTimelineTweetToTweet = (tweet: any): Tweet => {
  const legacy = extractLegacyData(tweet);
  const media = legacy.entities?.media || [];
  const userData = extractUserData(tweet);

  return {
    id: tweet.rest_id,
    userId: userData.userId,
    username: userData.username,
    displayName: userData.displayName,
    text: legacy.full_text || legacy.text,
    timeParsed: new Date(legacy.created_at),
    hashtags: legacy.entities?.hashtags || [],
    mentions: legacy.entities?.user_mentions || [],
    photos: extractPhotos(media),
    videos: extractVideos(media),
    urls: extractUrls(legacy.entities),
    ...(tweet.thread && { thread: tweet.thread }),
  };
};
