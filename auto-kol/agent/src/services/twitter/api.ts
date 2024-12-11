import { Scraper, SearchMode, Tweet } from 'agent-twitter-client';
import { createLogger } from '../../utils/logger.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config } from '../../config/index.js';

const logger = createLogger('agent-twitter-api');

class ExtendedScraper extends Scraper {
    async getMyMentions(maxResults: number = 100, sinceId?: string) {
        const isLoggedIn = await this.isLoggedIn();
        if (!isLoggedIn) {
            throw new Error('Must be logged in to fetch mentions');
        }
    
        const query = `to:${config.TWITTER_USERNAME} -from:${config.TWITTER_USERNAME}`;
        const replies: Tweet[] = [];
        
        const searchIterator = this.searchTweets(query, maxResults, SearchMode.Latest);
        
        for await (const reply of searchIterator) {
            logger.info('Checking reply:', {
                id: reply.id,
                text: reply.text,
                inReplyToStatusId: reply.inReplyToStatusId,
                inReplyToUserId: reply.inReplyToStatus?.userId
            });
            
            if (sinceId && reply.id && reply.id <= sinceId) {
                break;
            }
            
            if (reply.inReplyToStatusId && reply.inReplyToStatus?.userId === config.AGENT_TWITTER_ID) {
                replies.push(reply);
            }
            
            if (replies.length >= maxResults) {
                break;
            }
        }
    
        return replies;
    }
}

export const createTwitterClientScraper = async () => {
    try {
        const username = config.TWITTER_USERNAME!;
        const password = config.TWITTER_PASSWORD!;
        const cookiesPath = 'cookies.json';

        const scraper = new ExtendedScraper();
        if (existsSync(cookiesPath)) {
            logger.info('Loading existing cookies');
            const cookies = readFileSync(cookiesPath, 'utf8');
            try {
                const parsedCookies = JSON.parse(cookies).map((cookie: any) =>
                    `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`
                );
                await scraper.setCookies(parsedCookies);
                logger.info('Loaded existing cookies from file');
            } catch (error) {
                logger.error('Error loading cookies:', error);
            }
        } else {
            logger.info('No existing cookies found, proceeding with login');
            await scraper.login(username, password);

            const newCookies = await scraper.getCookies();
            writeFileSync(cookiesPath, JSON.stringify(newCookies, null, 2));
            logger.info('New cookies saved to file');
        }

        const isLoggedIn = await scraper.isLoggedIn();
        logger.info(`Login status: ${isLoggedIn}`);
        return scraper;
    } catch (error) {
        logger.error('Failed to create Twitter client:', error);
        throw error;
    }
};



export async function testMentions() {
    try {
        const scraper = await createTwitterClientScraper();
        
        logger.info('Fetching recent mentions...');
        const mentions = await scraper.getMyMentions(1000);
        logger.info(`Found ${mentions.length} mentions:`);
        mentions.forEach(mention => {
            logger.info({
                id: mention.id,
                text: mention.text,
                author: mention.username,
                inReplyTo: mention.inReplyToStatusId,
                created: mention.timeParsed
            });
        });

        if (mentions.length > 0) {
            const sinceId = mentions[0].id;
            logger.info(`\nFetching mentions since ID ${sinceId}...`);
            const newMentions = await scraper.getMyMentions(10, sinceId);
            logger.info(`Found ${newMentions.length} new mentions`);
        }

    } catch (error) {
        logger.error('Error testing mentions:', error);
    }
}
