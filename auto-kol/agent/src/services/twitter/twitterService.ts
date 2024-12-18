import { createLogger } from '../../utils/logger.js';
import { createTwitterAPI, TwitterAPI } from './api.js';
import * as db from '../../database/index.js';
import { KOL } from '../../types/kol.js';
import { TimeLineTweet } from '../../types/queue.js';
import { Tweet, TwitterConfig } from './types.js';

const logger = createLogger('twitter-service');

export interface TwitterService {
    twitterAPI: TwitterAPI;
    updateKOLs: () => Promise<KOL[]>;
    getKOLsAccounts: () => Promise<string[]>;
    getTimeLine: () => Promise<Tweet[]>;
    clearTimeLine: () => void;
    getTimeLineTweets: () => Promise<Tweet[]>;
    getUserProfile: (username: string) => Promise<KOL>;
}

export const createTwitterService = async (config: TwitterConfig): Promise<TwitterService> => {
    const twitterAPI = await createTwitterAPI(config);
    let timeLineTweets: TimeLineTweet[] = [];

    const updateKOLs = async (): Promise<KOL[]> => {
        const currentKOLs = await db.getKOLAccounts();
        const twitterProfile = await twitterAPI.getProfile(config.username);
        const followings = await twitterAPI.getFollowing(twitterProfile.userId!, 1000);
        logger.info(`following count: ${twitterProfile.followingCount}`);

        const newKOLs: KOL[] = [];
        for (const following of followings) {
            if (!currentKOLs.some(kol => kol.username === following.username)) {
                const newKOL = {
                    id: following.userId!,
                    username: following.username!.toLowerCase(),
                    created_at: following.joined!,
                };
                newKOLs.push(newKOL);
                await db.addKOL(newKOL);
            }
        }

        return newKOLs;
    };

    const getKOLsAccounts = async (): Promise<string[]> => {
        const kolAccounts = await db.getKOLAccounts();
        return kolAccounts.map(kol => kol.username);
    };

    const getTimeLine = async (): Promise<Tweet[]> => {
        const validTweetIds = timeLineTweets
            .map(tweet => tweet.id)
            .filter(id => id != null);

        const timeline = await twitterAPI.fetchHomeTimeline(0, validTweetIds);
        clearTimeLine();

        for (const tweet of timeline.slice(0, config.maxTimelineTweets)) {
            timeLineTweets.push({
                id: tweet.id!,
            });
        }

        logger.info(`Time line tweets size: ${timeLineTweets.length}`);
        return timeline;
    };

    const clearTimeLine = (): void => {
        timeLineTweets = [];
    };

    const getTimeLineTweets = async (): Promise<Tweet[]> => {
        const tweets: Tweet[] = [];
        logger.info(`Processing ${timeLineTweets.length} timeline tweets`);

        for (const tweet of timeLineTweets) {
            const result = await twitterAPI.getTweet(tweet.id!);
            if (result) tweets.push(result);
        }
        return tweets;
    };

    const getUserProfile = async (username: string): Promise<KOL> => {
        const user = await twitterAPI.getProfile(username);
        return {
            id: user.userId!,
            username: user.username!.toLowerCase(),
            created_at: user.joined!,
        };
    };

    return {
        twitterAPI,
        updateKOLs,
        getKOLsAccounts,
        getTimeLine,
        clearTimeLine,
        getTimeLineTweets,
        getUserProfile,
    };
}; 