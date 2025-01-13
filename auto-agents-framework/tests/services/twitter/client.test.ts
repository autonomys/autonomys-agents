import { createTwitterApi } from '../../../src/services/twitter/client';
import { Scraper } from 'agent-twitter-client';
import { vol } from 'memfs';

// Mock fs module with memfs
jest.mock('fs', () => require('memfs'));

jest.mock('agent-twitter-client', () => ({
  Scraper: jest.fn().mockImplementation(() => ({
    login: jest.fn().mockResolvedValue(undefined),
    setCookies: jest.fn().mockResolvedValue(undefined),
    getCookies: jest.fn().mockResolvedValue([]),
    isLoggedIn: jest.fn().mockResolvedValue(true),
    getUserIdByScreenName: jest.fn().mockResolvedValue('123456'),
  })),
}));

describe('Twitter Client', () => {
  const username = 'test-user';
  const password = 'test-pass';
  const cookiesPath = '/test/cookies.json';

  beforeEach(() => {
    vol.reset();
    vol.mkdirSync('/test', { recursive: true });
    jest.clearAllMocks();
  });

  it('should create a Twitter API instance', async () => {
    const api = await createTwitterApi(username, password, cookiesPath);

    expect(api).toBeDefined();
    expect(api.username).toBe(username);
    expect(api.scraper).toBeDefined();
  });

  it('should handle login when no cookies exist', async () => {
    const api = await createTwitterApi(username, password, cookiesPath);

    expect(Scraper).toHaveBeenCalled();
    expect(api.scraper.login).toHaveBeenCalledWith(username, password);
  });

  it('should use existing cookies when available', async () => {
    // Create a mock cookie file
    vol.fromJSON({
      [cookiesPath]: JSON.stringify([{ name: 'cookie1', value: 'value1' }]),
    });

    const api = await createTwitterApi(username, password, cookiesPath);

    expect(api.scraper.setCookies).toHaveBeenCalled();
    expect(api.scraper.login).not.toHaveBeenCalled();
  });
});
