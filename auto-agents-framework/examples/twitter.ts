import { TwitterAPI, createTwitterAPI } from '../src/services/twitter/client.js';
import { config } from '../src/config/index.js';
import { createLogger } from '../src/utils/logger.js';

const logger = createLogger('twitter', './examples/logs');

const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;

const twitterAPI: TwitterAPI = await createTwitterAPI(USERNAME, PASSWORD, COOKIES_PATH);

const myMentions = await twitterAPI.getMyMentions(50);

logger.info('My Mentions', { myMentions });
