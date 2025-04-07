import { Scraper } from 'agent-twitter-client';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { retryWithBackoff } from '../../../utils/retry.js';
import { createLogger } from '../../../utils/logger.js';
const logger = createLogger('twitter-api');

const getScraperWithCookies = async (cookiesPath: string): Promise<Scraper> => {
  logger.info('Loading existing cookies');
  const cookies = readFileSync(cookiesPath, 'utf8');
  try {
    const parsedCookies = JSON.parse(cookies).map(
      (
        cookie: any, // eslint-disable-line @typescript-eslint/no-explicit-any
      ) => `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}`,
    );
    const scraper = new Scraper();
    await scraper.setCookies(parsedCookies);
    logger.info('Loaded existing cookies from file');
    return scraper;
  } catch (error) {
    logger.error('Error loading cookies:', error);
    throw error;
  }
};

const login = async (username: string, password: string, cookiesPath: string): Promise<Scraper> => {
  logger.info('Logging in:', { username });
  const scraper = new Scraper();
  await scraper.login(username, password);

  const newCookies = await scraper.getCookies();
  writeFileSync(cookiesPath, JSON.stringify(newCookies, null, 2));
  logger.info('New cookies saved to file');
  return scraper;
};

// Try cookie authentication
const authenticateWithCookies = async (cookiesPath: string): Promise<Scraper | undefined> => {
  if (!existsSync(cookiesPath)) {
    logger.info('No cookie file exists, skipping cookie authentication');
    return undefined;
  }

  try {
    const scraper = await getScraperWithCookies(cookiesPath);
    logger.info('Loaded cookies, checking login status');

    const isLoggedIn = await scraper.isLoggedIn();
    const me = await scraper.me();
    logger.info('Authentication check:', { me, isLoggedIn });

    return scraper;
  } catch (error) {
    logger.error('Error during cookie authentication:', error);
    return undefined;
  }
};

// Try username/password authentication
const authenticateWithLogin = async (
  username: string,
  password: string,
  cookiesPath: string,
): Promise<Scraper | undefined> => {
  try {
    logger.info('Attempting fresh login');
    const scraper = await login(username, password, cookiesPath);

    const isLoggedIn = await scraper.isLoggedIn();
    const me = await scraper.me();
    logger.info('Login authentication check:', { me, isLoggedIn });

    return scraper;
  } catch (error) {
    logger.error('Error during fresh login:', error);
    return undefined;
  }
};

export const createAuthenticatedScraper = async (
  username: string,
  password: string,
  cookiesPath: string,
): Promise<Scraper> => {
  const cookieScraper = await retryWithBackoff(
    async () => {
      const scraper = await authenticateWithCookies(cookiesPath);
      const isLoggedIn = await scraper?.isLoggedIn();
      if (!isLoggedIn) {
        logger.error('Cookie authentication failed');
        throw new Error('Cookie authentication failed');
      }
      return scraper;
    },
    {
      maxRetries: 8,
      initialDelay: 2000,
    },
  ).catch(error => {
    logger.error('Error during cookie authentication:', error);
    return undefined;
  });

  if (cookieScraper) {
    logger.info('Successfully authenticated with cookies');
    return cookieScraper;
  }

  logger.info('All cookie authentication attempts failed, trying fresh login');

  // Try fresh login with retries if cookie authentication failed
  const loginScraper = await retryWithBackoff(
    async () => {
      const scraper = await authenticateWithLogin(username, password, cookiesPath);
      const isLoggedIn = await scraper?.isLoggedIn();
      if (!isLoggedIn) {
        logger.error('Login authentication failed');
        throw new Error('Login authentication failed');
      }
      return scraper;
    },
    {
      maxRetries: 3,
      initialDelay: 2000,
    },
  ).catch(error => {
    logger.error('Error during fresh login:', error);
    return undefined;
  });

  if (loginScraper) {
    logger.info('Successfully authenticated with fresh login');
    return loginScraper;
  }

  throw new Error('Failed to authenticate with Twitter after all attempts');
};
