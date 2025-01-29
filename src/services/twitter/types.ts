import { Profile, Scraper, Tweet } from 'agent-twitter-client';
export { Tweet, Profile, Scraper } from 'agent-twitter-client';

export interface TwitterApi {
  scraper: Scraper;
  username: string;
  userId: string;
  getMyUnrepliedToMentions: (maxResults: number, sinceId?: string) => Promise<Tweet[]>;
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
  sendTweet: (tweet: string, inReplyTo?: string) => Promise<void>;
  likeTweet: (tweetId: string) => Promise<void>;
  followUser: (userId: string) => Promise<void>;
}
