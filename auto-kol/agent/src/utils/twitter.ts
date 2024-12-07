import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import {createTwitterClientScraper } from '../services/twitter/api.js';
import * as db from '../database/index.js';
import { KOL } from '../types/kol.js';
const logger = createLogger('twitter-utils');
const twitterScraper = await createTwitterClientScraper();

export const updateKOLs = async () => {
    const currentKOLs = await db.getKOLAccounts();
    const followings = await twitterScraper.getFollowing(config.AGENT_TWITTER_ID!, 1000);
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