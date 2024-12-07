import { Scraper } from 'agent-twitter-client';
import { createLogger } from '../../utils/logger.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { config } from '../../config/index.js';


const logger = createLogger('agent-twitter-api');

export const createTwitterClientScraper = async () => {
    try {
        const username = config.TWITTER_USERNAME!;
        const password = config.TWITTER_PASSWORD!;
        const cookiesPath = 'cookies.json';

        const scraper = new Scraper();
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




