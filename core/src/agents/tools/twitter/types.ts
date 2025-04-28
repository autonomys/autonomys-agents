import { type Profile, Scraper, type Tweet } from 'agent-twitter-client';
export { type Tweet, type Profile, Scraper } from 'agent-twitter-client';

export interface TwitterApi {
  scraper: Scraper;
  username: string;
  userId: string;
  getMyUnrepliedToMentions: (
    maxResults: number,
    maxThreadDepth?: number,
    ignoreConversationIds?: string[],
    sinceId?: string,
  ) => Promise<Tweet[]>;
  getFollowingRecentTweets: (maxResults: number, numberOfUsers: number) => Promise<Tweet[]>;
  isLoggedIn: () => Promise<boolean>;
  getProfile: (username: string) => Promise<Profile>;
  getMyProfile: () => Promise<Profile>;
  getTweet: (tweetId: string) => Promise<Tweet | null>;
  getRecentTweets: (username: string, limit: number) => Promise<Tweet[]>;
  getMyRecentTweets: (limit: number) => Promise<Tweet[]>;
  getMyRepliedToIds: () => Promise<string[]>;
  getMyRecentReplies: (limit: number) => Promise<Tweet[]>;
  getFollowing: (userId: string, limit: number) => Promise<Profile[]>;
  getMyTimeline: (count: number, excludeIds: string[]) => Promise<Tweet[]>;
  getFollowingTimeline: (count: number, excludeIds: string[]) => Promise<Tweet[]>;
  searchTweets: (query: string, count: number) => Promise<Tweet[]>;
  sendTweet: (tweet: string, inReplyTo?: string) => Promise<string>;
  quoteTweet: (text: string, quoteTweetId: string) => Promise<string>;
  likeTweet: (tweetId: string) => Promise<void>;
  followUser: (username: string) => Promise<void>;
}
