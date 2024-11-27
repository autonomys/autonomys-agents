import { TwitterApi } from 'twitter-api-v2';
import { TwitterCredentials, StreamRule } from '../../types/twitter';
import { createLogger } from '../../utils/logger';

const logger = createLogger('twitter-api');

export const createTwitterClient = (credentials: TwitterCredentials): TwitterApi =>
    new TwitterApi(credentials);

export const clearStreamRules = async (client: TwitterApi): Promise<void> => {
    const rules = await client.v2.streamRules();
    if (rules.data?.length) {
        await client.v2.updateStreamRules({
            delete: { ids: rules.data.map(rule => rule.id) }
        });
    }
};

export const addStreamRules = async (
    client: TwitterApi,
    accounts: readonly string[]
): Promise<void> => {
    const rules: StreamRule[] = accounts.map(account => ({
        value: `from:${account}`
    }));

    await client.v2.updateStreamRules({ add: rules });
    logger.info(`Monitoring accounts: ${accounts.join(', ')}`);
};

export const setupTwitterStream = async (
    client: TwitterApi,
    accounts: readonly string[]
): Promise<void> => {
    try {
        await clearStreamRules(client);
        await addStreamRules(client, accounts);
    } catch (error) {
        logger.error('Error setting up Twitter stream:', error);
        throw error;
    }
}; 