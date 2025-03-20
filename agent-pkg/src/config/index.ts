import fs from 'fs/promises';
import { Config, Credentials } from '../types/index.js';
import { CONFIG_FILE } from '../utils/shared/path.js';
import { getFromKeychain } from '../utils/vault/keychain.js';
import { credentialsExist, loadCredentials } from '../utils/credential/index.js';
import { DEFAULT_CONFIG } from './default.js';


const loadConfig = async () => {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    console.log('No config file found, creating default config', error);
    const config = { ...DEFAULT_CONFIG };
    await saveConfig(config);
    return config;
  }
};

const saveConfig = async (config: Config) => {
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
};

const initializeConfigAndCredentials = async () => {
  const config = await loadConfig();

  let credentials: Credentials = {};

  if (await credentialsExist()) {
    try {
      const keychainPassword = await getFromKeychain();
      if (keychainPassword) {
        console.log('Using system keychain password for initialization');
        credentials = await loadCredentials();
      } else {
        console.log(
          'No password found in system keychain, will prompt during operations that need credentials',
        );
      }
    } catch (error) {
      console.log('Will prompt for credentials when needed', error);
    }
  }

  return {
    config,
    credentials,
  };
};

export { loadConfig, saveConfig, initializeConfigAndCredentials };