import { Scraper } from 'agent-twitter-client';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { Cookie } from 'tough-cookie';
import { createLogger } from '../../utils/logger.js';
import { retryWithBackoff } from './utils.js';
const logger = createLogger('twitter-api');

const loadCookies = async (scraper: Scraper, cookiesPath: string): Promise<void> => {
  logger.info('Loading existing cookies');
  const cookies = JSON.parse(readFileSync(cookiesPath, 'utf-8'));
  try {
    const parsedCookie = cookies.reduce((acc: string[], current: unknown) => {
      const cookie = Cookie.fromJSON(current)?.cookieString();
      acc.push(cookie || '');
      return acc;
    }, []);
    await scraper.setCookies(parsedCookie);
    logger.info('Loaded existing cookies from file');
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

  const scraper = new Scraper();
  try {
    await loadCookies(scraper, cookiesPath);
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
      if (!scraper) throw new Error('Cookie authentication failed');
      return scraper;
    },
    4,
    2000,
  ).catch(() => undefined);

  if (cookieScraper) {
    logger.info('Successfully authenticated with cookies');
    return cookieScraper;
  }

  logger.info('All cookie authentication attempts failed, trying fresh login');

  // Try fresh login with retries if cookie authentication failed
  const loginScraper = await retryWithBackoff(
    async () => {
      const scraper = await authenticateWithLogin(username, password, cookiesPath);
      if (!scraper) throw new Error('Login authentication failed');
      return scraper;
    },
    3,
    2000,
  ).catch(() => undefined);

  if (loginScraper) {
    logger.info('Successfully authenticated with fresh login');
    return loginScraper;
  }

  throw new Error('Failed to authenticate with Twitter after all attempts');
};
