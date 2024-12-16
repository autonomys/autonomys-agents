import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { createTwitterClientScraper } from '../services/twitter/api.js';
import * as db from '../database/index.js';
import { KOL } from '../types/kol.js';
import { TimeLineTweet } from '../types/queue.js';
import { Tweet } from '../types/twitter.js';

const logger = createLogger('twitter-utils');
const twitterScraper = await createTwitterClientScraper();


export const timeLineTweets: TimeLineTweet[] = [];

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
    const validTweetIds = timeLineTweets
        .map(tweet => tweet.id)
        .filter(id => id != null);
    const timeline = await twitterScraper.fetchHomeTimeline(0, validTweetIds);
    clearTimeLine();
    for (const tweet of timeline.slice(0, config.MAX_TIMELINE_TWEETS)) {
        timeLineTweets.push({
            id: tweet.rest_id!,
        });
    }
    logger.info(`Time line tweets size: ${timeLineTweets.length}`);
    return timeline;
}

export const clearTimeLine = () => {
    timeLineTweets.length = 0;
}

export const getTimeLineTweets = async () => {
    const tweets: Tweet[] = [];
    console.error('timeLineTweets', timeLineTweets.length);
    for (const tweet of timeLineTweets) {
        const result = await twitterScraper.getTweet(tweet.id!);
        if (result) {
            tweets.push({
                id: result.id!,
                text: result.text!,
                author_id: result.userId!,
                author_username: result.username!.toLowerCase(),
                created_at: result.timeParsed!.toISOString(),
            })
        }
    }
    return tweets;
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