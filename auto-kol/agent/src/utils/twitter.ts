import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { createTwitterClientScraper } from '../services/twitter/api.js';
import * as db from '../database/index.js';
import { KOL } from '../types/kol.js';
import { Tweet } from '../types/twitter.js';

const logger = createLogger('twitter-utils');
const twitterScraper = await createTwitterClientScraper();
export const timelineTweets: Tweet[] = [];

export const updateKOLs = async () => {
    const currentKOLs = await db.getKOLAccounts();
    const twitterProfile = await twitterScraper.getProfile(config.TWITTER_USERNAME!);
    const followings = twitterScraper.getFollowing(twitterProfile.userId!, 1000);
    logger.info(`following count: ${twitterProfile.followingCount}`);

    const newKOLs: KOL[] = [];
    for await (const following of followings) {
        if (!currentKOLs.some(kol => kol.username === following.username)) {
            newKOLs.push({
                id: following.userId!,
                username: following.username!.toLowerCase(),
                created_at: following.joined!,
            });
            await db.addKOL(newKOLs[newKOLs.length - 1]);
        }
    }

    return newKOLs;
}

export const getKOLsAccounts = async () => {
    const kolAccounts = await db.getKOLAccounts();
    return kolAccounts.map(kol => kol.username);
}

export const getTimeLine = async () => {
    const validTweetIds = timelineTweets
        .map(tweet => tweet.id)
        .filter(id => id != null);
    const timeline = await twitterScraper.fetchHomeTimeline(0, validTweetIds);


    // clear timeline
    clearTimeLine();
    for (const tweet of timeline) {
        if (!tweet.legacy || !tweet.legacy.full_text) {
            logger.info(`Tweet full_text not found for tweet id: ${tweet.rest_id}`);
            continue;
        }
        timelineTweets.push({
            id: tweet.rest_id!,
            text: tweet.legacy!.full_text,
            author_id: tweet.legacy!.user_id_str!,
            author_username: tweet.core!.user_results!.result!.legacy!.screen_name,
            created_at: new Date(tweet.legacy!.created_at!).toISOString(),
        })
    }
    logger.info(`Timeline tweets size: ${timelineTweets.length}`);
    return timelineTweets;
}

const clearTimeLine = () => {
    timelineTweets.length = 0;
}

export const getUserProfile = async (username: string) => {
    const user = await twitterScraper.getProfile(username);
    const result: KOL = {
        id: user.userId!,
        username: user.username!.toLowerCase(),
        created_at: user.joined!,
    }
    return result;
}