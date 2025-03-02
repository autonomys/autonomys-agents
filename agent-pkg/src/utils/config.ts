import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import inquirer from 'inquirer';
import chalk from 'chalk';
import keytar from 'keytar';

const CONFIG_DIR = path.join(os.homedir(), '.autoOS');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.enc');

// Service name for keytar (system keychain)
const KEYCHAIN_SERVICE = 'autoOS-cli';
const KEYCHAIN_ACCOUNT = 'masterPassword';

// Add a password cache system to avoid prompting multiple times
// This will timeout after a certain period for security
interface PasswordCache {
  password: string;
  timestamp: number;
}

// Store password in memory only (not persisted)
let masterPasswordCache: PasswordCache | null = null;
// Cache timeout in milliseconds (10 minutes)
const PASSWORD_CACHE_TIMEOUT = 10 * 60 * 1000;

/**
 * Store the master password in the cache
 */
function cachePassword(password: string): void {
  masterPasswordCache = {
    password,
    timestamp: Date.now()
  };
}

/**
 * Get the cached password if it exists and hasn't expired
 * @returns The cached password or null if expired or not cached
 */
function getCachedPassword(): string | null {
  if (!masterPasswordCache) return null;
  
  const now = Date.now();
  const elapsed = now - masterPasswordCache.timestamp;
  
  if (elapsed > PASSWORD_CACHE_TIMEOUT) {
    // Password cache has expired
    masterPasswordCache = null;
    return null;
  }
  
  // Update the timestamp to extend the cache
  masterPasswordCache.timestamp = now;
  return masterPasswordCache.password;
}

/**
 * Save the master password to the system keychain
 */
async function saveToKeychain(password: string): Promise<boolean> {
  try {
    await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, password);
    return true;
  } catch (error) {
    console.log(chalk.yellow('Unable to save to system keychain. In-memory caching will be used instead.'));
    console.log(chalk.gray(`Error: ${error}`));
    return false;
  }
}

/**
 * Get the master password from the system keychain
 */
async function getFromKeychain(): Promise<string | null> {
  try {
    const password = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
    return password;
  } catch (error) {
    console.log(chalk.yellow('Unable to access system keychain. Falling back to other methods.'));
    console.log(chalk.gray(`Error: ${error}`));
    return null;
  }
}

/**
 * Delete the master password from the system keychain
 */
async function deleteFromKeychain(): Promise<boolean> {
  try {
    return await keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
  } catch (error) {
    console.log(chalk.yellow('Unable to remove from system keychain.'));
    console.log(chalk.gray(`Error: ${error}`));
    return false;
  }
}

const DEFAULT_CONFIG = {
  autoDriveNetwork: 'mainnet',
  taurusRpcUrl: 'https://auto-evm.taurus.autonomys.xyz/ws',
  packageRegistryAddress: '0x0B5cF4C198E8c75e8fE9B4D33F0B29881D13744b',
  autoSaveCredentials: true,
  useKeychain: true
};

interface Credentials {
  autoDriveApiKey?: string;  
  autoDriveEncryptionPassword?: string;  
  autoEvmPrivateKey?: string;  
}

/**
 * Ensure the config directory exists
 */
async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating config directory:', error);
  }
}

/**
 * Load the configuration file
 */
export async function loadConfig() {
  await ensureConfigDir();
  
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    // If file doesn't exist, create default config
    const config = { ...DEFAULT_CONFIG };
    await saveConfig(config);
    return config;
  }
}

/**
 * Save the configuration file
 */
export async function saveConfig(config: any) {
  await ensureConfigDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Encrypt credentials with a master password
 */
async function encryptCredentials(credentials: Credentials, masterPassword: string): Promise<Buffer> {
  const key = scryptSync(masterPassword, 'salt', 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  
  const data = JSON.stringify(credentials);
  const encrypted = Buffer.concat([iv, cipher.update(data, 'utf8'), cipher.final()]);
  
  return encrypted;
}

/**
 * Decrypt credentials with a master password
 */
async function decryptCredentials(encryptedData: Buffer, masterPassword: string): Promise<Credentials> {
  try {
    const iv = encryptedData.subarray(0, 16);
    const encryptedCredentials = encryptedData.subarray(16);
    
    const key = scryptSync(masterPassword, 'salt', 32);
    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    
    const decrypted = Buffer.concat([
      decipher.update(encryptedCredentials),
      decipher.final()
    ]).toString('utf8');
    
    return JSON.parse(decrypted) as Credentials;
  } catch (error) {
    throw new Error('Failed to decrypt credentials. Incorrect password? ' + error);
  }
}

/**
 * Save credentials to an encrypted file
 */
export async function saveCredentials(credentials: Credentials, masterPassword: string) {
  await ensureConfigDir();
  
  const encrypted = await encryptCredentials(credentials, masterPassword);
  await fs.writeFile(CREDENTIALS_FILE, encrypted);
  
  // Cache the password
  cachePassword(masterPassword);
  
  // Get the current config to check if keychain is enabled
  const config = await loadConfig();
  if (config.useKeychain) {
    // Save to keychain
    await saveToKeychain(masterPassword);
  }
}

/**
 * Load credentials from an encrypted file
 */
export async function loadCredentials(masterPassword: string): Promise<Credentials> {
  await ensureConfigDir();
  
  try {
    const encryptedData = await fs.readFile(CREDENTIALS_FILE);
    return await decryptCredentials(encryptedData, masterPassword);
  } catch (error) {
    console.log("Error loading credentials:", error);
    return {};
  }
}

/**
 * Check if credentials exist
 */
export async function credentialsExist(): Promise<boolean> {
  try {
    await fs.access(CREDENTIALS_FILE);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Prompt user for required configuration
 */
export async function promptForConfig() {
  console.log(chalk.blue('Configuration setup for autoOS CLI'));
  
  const currentConfig = await loadConfig();
  
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'autoDriveNetwork',
      message: 'Select Autonomys Auto Drive network:',
      choices: ['mainnet', 'taurus'],
      default: currentConfig.autoDriveNetwork
    },
    {
      type: 'input',
      name: 'taurusRpcUrl',
      message: 'Taurus RPC URL:',
      default: currentConfig.taurusRpcUrl
    },
    {
      type: 'input',
      name: 'packageRegistryAddress',
      message: 'Package Registry contract address:',
      default: currentConfig.packageRegistryAddress
    },
    {
      type: 'confirm',
      name: 'useKeychain',
      message: 'Store master password in system keychain?',
      default: currentConfig.useKeychain === undefined ? true : currentConfig.useKeychain
    }
  ]);
  
  // If keychain setting changed from true to false, remove any existing keychain entry
  if (currentConfig.useKeychain && !answers.useKeychain) {
    await deleteFromKeychain();
  }
  
  await saveConfig({ ...currentConfig, ...answers });
  console.log(chalk.green('Configuration saved successfully'));
}

/**
 * Prompt user for required credentials
 */
export async function promptForCredentials() {
  console.log(chalk.blue('Credential setup for autoOS CLI'));
  
  const hasExistingCredentials = await credentialsExist();
  let masterPassword: string;
  
  if (hasExistingCredentials) {
    const { password, action } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter your master password:',
        mask: '*'
      },
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: ['Update credentials', 'Use existing credentials'],
        default: 'Use existing credentials'
      }
    ]);
    
    masterPassword = password;
    
    if (action === 'Use existing credentials') {
      try {
        const credentials = await loadCredentials(masterPassword);
        // Cache the password for future use
        cachePassword(masterPassword);
        
        // Save to keychain if enabled
        const config = await loadConfig();
        if (config.useKeychain) {
          await saveToKeychain(masterPassword);
        }
        
        return credentials;
      } catch (error) {
        console.error(chalk.red('Failed to decrypt credentials. Please try again.'));
        return promptForCredentials();
      }
    }
  } else {
    const { password, useKeychain } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Create a master password to secure your credentials:',
        mask: '*',
        validate: (input: string) => {
          if (input.length < 8) {
            return 'Password must be at least 8 characters';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'confirmPassword',
        message: 'Confirm master password:',
        mask: '*',
        validate: (input: string, answers: any) => {
          if (input !== answers.password) {
            return 'Passwords do not match';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'useKeychain',
        message: 'Store master password in system keychain?',
        default: true
      }
    ]);
    
    masterPassword = password;
    
    // Update config with keychain preference
    const currentConfig = await loadConfig();
    await saveConfig({
      ...currentConfig,
      useKeychain
    });
  }
  
  // Prompt for credentials
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'autoDriveApiKey',
      message: 'Autonomys Auto Drive API Key:',
      validate: (input: string) => input.trim() !== '' || 'API Key is required'
    },
    {
      type: 'password',
      name: 'autoDriveEncryptionPassword',
      message: 'Auto Drive Encryption Password (optional):',
      mask: '*'
    },
    {
      type: 'password',
      name: 'autoEvmPrivateKey',
      message: 'Auto-EVM Private Key (for blockchain operations):',
      mask: '*',
      validate: (input: string) => {
        if (input.trim() === '') {
          return 'Private key is required for blockchain operations';
        }
        if (!/^(0x)?[0-9a-fA-F]{64}$/.test(input)) {
          return 'Invalid private key format';
        }
        return true;
      }
    },
    {
      type: 'confirm',
      name: 'saveCredentials',
      message: 'Save these credentials for future use?',
      default: true
    }
  ]);
  
  const credentials: Credentials = {
    autoDriveApiKey: answers.autoDriveApiKey,
    autoDriveEncryptionPassword: answers.autoDriveEncryptionPassword || undefined,
    autoEvmPrivateKey: answers.autoEvmPrivateKey
  };
  
  if (answers.saveCredentials) {
    await saveCredentials(credentials, masterPassword);
    console.log(chalk.green('Credentials saved successfully'));
    
    // Update config
    const currentConfig = await loadConfig();
    await saveConfig({
      ...currentConfig,
      autoSaveCredentials: true
    });
  }
  
  return credentials;
}

/**
 * Get credentials - either from file or by prompting
 */
export async function getCredentials(): Promise<Credentials> {
  console.log("getCredentials called");
  if (await credentialsExist()) {
    console.log("Credentials exist, checking for master password");
    
    // First check if we have a cached password
    const cachedPassword = getCachedPassword();
    if (cachedPassword) {
      console.log("Using cached master password");
      try {
        return await loadCredentials(cachedPassword);
      } catch (error) {
        console.error(chalk.red('Cached password is no longer valid. Will try other methods.'));
        masterPasswordCache = null;
      }
    }
    
    // Then check system keychain
    const config = await loadConfig();
    if (config.useKeychain) {
      const keychainPassword = await getFromKeychain();
      if (keychainPassword) {
        console.log("Using master password from system keychain");
        try {
          const credentials = await loadCredentials(keychainPassword);
          // Cache the password for this session
          cachePassword(keychainPassword);
          return credentials;
        } catch (error) {
          console.error(chalk.red('System keychain password is no longer valid. Will try other methods.'));
          // Remove invalid password from keychain
          await deleteFromKeychain();
        }
      }
    }
    
    if (process.env.AUTOOS_MASTER_PASSWORD) {
      console.log("Using master password from environment variable");
      try {
        const credentials = await loadCredentials(process.env.AUTOOS_MASTER_PASSWORD);
        // Cache the password for future use
        cachePassword(process.env.AUTOOS_MASTER_PASSWORD);
        
        // Save to keychain if enabled
        if (config.useKeychain) {
          await saveToKeychain(process.env.AUTOOS_MASTER_PASSWORD);
        }
        
        return credentials;
      } catch (error) {
        console.error(chalk.red('Environment variable password is not valid. Will prompt for password.'));
      }
    }
    
    // Finally, prompt the user interactively
    console.log("Prompting for master password");
    const { password, rememberChoice } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter your master password:',
        mask: '*'
      },
      {
        type: 'list',
        name: 'rememberChoice',
        message: 'Remember this password?',
        choices: [
          { name: 'Yes, store in system keychain', value: 'keychain' },
          { name: 'Yes, for this session only', value: 'session' },
          { name: 'No, ask me each time', value: 'never' }
        ],
        default: config.useKeychain ? 'keychain' : 'session'
      }
    ]);
    
    console.log("Password received, attempting to decrypt");
    try {
      const credentials = await loadCredentials(password);
      
      // Handle password storage based on user choice
      if (rememberChoice === 'keychain') {
        await saveToKeychain(password);
        // Also update the config to use keychain if not already set
        if (!config.useKeychain) {
          await saveConfig({
            ...config,
            useKeychain: true
          });
        }
      }
      
      if (rememberChoice === 'keychain' || rememberChoice === 'session') {
        // Cache the password for this session
        cachePassword(password);
      }
      
      return credentials;
    } catch (error) {
      console.error(chalk.red('Failed to decrypt credentials. Please try again.'));
      return getCredentials();
    }
  } else {
    console.log("No credentials exist, prompting for new credentials");
    return promptForCredentials();
  }
}

/**
 * Initialize configuration and credentials
 * @returns Object with all necessary configuration and credentials
 */
export async function initializeConfigAndCredentials() {
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
          console.log("Using system keychain password for initialization");
          credentials = await loadCredentials(keychainPassword);
          // Cache the password for this session
          cachePassword(keychainPassword);
        } else if (process.env.AUTOOS_MASTER_PASSWORD) {
          console.log("Using master password from environment variable for initialization");
          credentials = await loadCredentials(process.env.AUTOOS_MASTER_PASSWORD);
          // Cache the password for future use
          cachePassword(process.env.AUTOOS_MASTER_PASSWORD);
          // Also save to keychain if enabled
          if (config.useKeychain) {
            await saveToKeychain(process.env.AUTOOS_MASTER_PASSWORD);
          }
        } else {
          console.log("No password found in system keychain, will prompt during operations that need credentials");
        }
      }
      // Then check for environment variable
      else if (process.env.AUTOOS_MASTER_PASSWORD) {
        console.log("Using master password from environment variable for initialization");
        credentials = await loadCredentials(process.env.AUTOOS_MASTER_PASSWORD);
        // Cache the password for future use
        cachePassword(process.env.AUTOOS_MASTER_PASSWORD);
      } else {
        console.log("No cached or environment password found, will prompt during operations that need credentials");
      }
    } catch (error) {
      console.log("Will prompt for credentials when needed");
    }
  }
  
  return {
    config,
    credentials,
    getCredentials
  };
} 