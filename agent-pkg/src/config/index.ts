import fs from 'fs/promises';
import { Credentials } from '../types/index.js';
import { CONFIG_FILE } from '../utils/shared/path.js';
import { saveToKeychain, getFromKeychain } from '../utils/vault/keychain.js';
import { credentialsExist, loadCredentials, getCredentials } from '../utils/credential/index.js';
import { DEFAULT_CONFIG } from './default.js';
import { cachePassword, getCachedPassword } from '../utils/vault/cache.js';


/**
 * Load the configuration file
 */
export const loadConfig = async () => {

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    // If file doesn't exist, create default config
    const config = { ...DEFAULT_CONFIG };
    await saveConfig(config);
    return config;
  }
};

/**
 * Save the configuration file
 */
export const saveConfig = async (config: any) => {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
};

/**
 * Initialize configuration and credentials
 * @returns Object with all necessary configuration and credentials
 */
export const initializeConfigAndCredentials = async () => {
  const config = await loadConfig();

  let credentials: Credentials = {};

  if (await credentialsExist()) {
    try {
      // First check if we have a cached password
      const cachedPassword = getCachedPassword();
      if (cachedPassword) {
        credentials = await loadCredentials(cachedPassword);
      }
      // Then check system keychain
      else if (config.useKeychain) {
        const keychainPassword = await getFromKeychain();
        if (keychainPassword) {
          console.log('Using system keychain password for initialization');
          credentials = await loadCredentials(keychainPassword);
          // Cache the password for this session
          cachePassword(keychainPassword);
        } else if (process.env.AUTOOS_MASTER_PASSWORD) {
          console.log('Using master password from environment variable for initialization');
          credentials = await loadCredentials(process.env.AUTOOS_MASTER_PASSWORD);
          // Cache the password for future use
          cachePassword(process.env.AUTOOS_MASTER_PASSWORD);
          // Also save to keychain if enabled
          if (config.useKeychain) {
            await saveToKeychain(process.env.AUTOOS_MASTER_PASSWORD);
          }
        } else {
          console.log(
            'No password found in system keychain, will prompt during operations that need credentials',
          );
        }
      }
      // Then check for environment variable
      else if (process.env.AUTOOS_MASTER_PASSWORD) {
        console.log('Using master password from environment variable for initialization');
        credentials = await loadCredentials(process.env.AUTOOS_MASTER_PASSWORD);
        // Cache the password for future use
        cachePassword(process.env.AUTOOS_MASTER_PASSWORD);
      } else {
        console.log(
          'No cached or environment password found, will prompt during operations that need credentials',
        );
      }
    } catch (error) {
      console.log('Will prompt for credentials when needed');
    }
  }

  return {
    config,
    credentials,
    getCredentials,
  };
};
