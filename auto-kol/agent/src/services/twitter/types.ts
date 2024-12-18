export { Tweet } from 'agent-twitter-client';
export interface TwitterConfig {
    username: string;
    password: string;
    maxTimelineTweets?: number;
    cookiesPath?: string;
}

export interface TwitterServiceOptions {
    cookiesPath?: string;
} 