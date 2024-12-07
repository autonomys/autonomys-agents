import { Scraper } from 'agent-twitter-client';
import { createLogger } from '../../utils/logger.js';
import { readFileSync, writeFileSync } from 'fs';
import { config } from '../../config/index.js';
const logger = createLogger('twitter-api');

export const createTwitterClientScraper = async (credentials: any) => {
    try {
        const scraper = new Scraper();        
        try {
            const cookies = readFileSync('cookies.json', 'utf8');
            if (cookies) {
                const parsedCookies = JSON.parse(cookies).map((cookie: any) =>
                    `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`
                );
                await scraper.setCookies(parsedCookies);
                logger.info('Loaded existing cookies from file');
            }
        } catch (error) {
            logger.info('No existing cookies found, proceeding with login');

            logger.info('Logging in with credentials:', {
                username: credentials.username,
                password: credentials.password
            });
            await scraper.login(credentials.username, credentials.password);

            // Save new cookies
            const newCookies = await scraper.getCookies();
            writeFileSync('cookies.json', JSON.stringify(newCookies, null, 2));
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

export const twitterClientScraper = async (): Promise<Scraper> => {
    return await createTwitterClientScraper({
        username: config.TWITTER_USERNAME!,
        password: config.TWITTER_PASSWORD!
    });
};


