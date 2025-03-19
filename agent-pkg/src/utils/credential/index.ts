
import fs from 'fs/promises';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Credentials } from '../../types/index.js';
import { CREDENTIALS_FILE } from '../shared/path.js';
import { loadConfig, saveConfig } from '../../config/index.js';
import { saveToKeychain, getFromKeychain, deleteFromKeychain } from '../vault/keychain.js';
import { cachePassword, getCachedPassword } from '../vault/cache.js';
import { promptForCredentials } from '../../config/prompts.js';


/**
 * Encrypt credentials with a master password
 */
const encryptCredentials = async (
    credentials: Credentials,
    masterPassword: string,
  ): Promise<Buffer> => {
    const key = scryptSync(masterPassword, 'salt', 32);
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', key, iv);
  
    const data = JSON.stringify(credentials);
    const encrypted = Buffer.concat([iv, cipher.update(data, 'utf8'), cipher.final()]);
  
    return encrypted;
  };
  
  /**
   * Decrypt credentials with a master password
   */
  const decryptCredentials = async (
    encryptedData: Buffer,
    masterPassword: string,
  ): Promise<Credentials> => {
    try {
      const iv = encryptedData.subarray(0, 16);
      const encryptedCredentials = encryptedData.subarray(16);
  
      const key = scryptSync(masterPassword, 'salt', 32);
      const decipher = createDecipheriv('aes-256-cbc', key, iv);
  
      const decrypted = Buffer.concat([
        decipher.update(encryptedCredentials),
        decipher.final(),
      ]).toString('utf8');
  
      return JSON.parse(decrypted) as Credentials;
    } catch (error) {
      throw new Error('Failed to decrypt credentials. Incorrect password? ' + error);
    }
  };
  
  /**
 * Save credentials to an encrypted file
 */
export const saveCredentials = async (credentials: Credentials, masterPassword: string) => {

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
  };
  
  /**
   * Load credentials from an encrypted file
   */
  export const loadCredentials = async (masterPassword: string): Promise<Credentials> => {
  
    try {
      const encryptedData = await fs.readFile(CREDENTIALS_FILE);
      return await decryptCredentials(encryptedData, masterPassword);
    } catch (error) {
      console.log('Error loading credentials:', error);
      return {};
    }
  };
  
  /**
   * Check if credentials exist
   */
  export const credentialsExist = async (): Promise<boolean> => {
    try {
      await fs.access(CREDENTIALS_FILE);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  /**
 * Get credentials - either from file or by prompting
 */
export const getCredentials = async (): Promise<Credentials> => {
    console.log('getCredentials called');
    if (await credentialsExist()) {
      console.log('Credentials exist, checking for master password');
  
      // First check if we have a cached password
      const cachedPassword = getCachedPassword();
      if (cachedPassword) {
        console.log('Using cached master password');
        try {
          return await loadCredentials(cachedPassword);
        } catch (error) {
          console.error(chalk.red('Cached password is no longer valid. Will try other methods.'));          
        }
      }
  
      // Then check system keychain
      const config = await loadConfig();
      if (config.useKeychain) {
        const keychainPassword = await getFromKeychain();
        if (keychainPassword) {
          console.log('Using master password from system keychain');
          try {
            const credentials = await loadCredentials(keychainPassword);
            // Cache the password for this session
            cachePassword(keychainPassword);
            return credentials;
          } catch (error) {
            console.error(
              chalk.red('System keychain password is no longer valid. Will try other methods.'),
            );
            // Remove invalid password from keychain
            await deleteFromKeychain();
          }
        }
      }
  
      if (process.env.AUTOOS_MASTER_PASSWORD) {
        console.log('Using master password from environment variable');
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
          console.error(
            chalk.red('Environment variable password is not valid. Will prompt for password.'),
          );
        }
      }
  
      // Finally, prompt the user interactively
      console.log('Prompting for master password');
      const { password, rememberChoice } = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter your master password:',
          mask: '*',
        },
        {
          type: 'list',
          name: 'rememberChoice',
          message: 'Remember this password?',
          choices: [
            { name: 'Yes, store in system keychain', value: 'keychain' },
            { name: 'Yes, for this session only', value: 'session' },
            { name: 'No, ask me each time', value: 'never' },
          ],
          default: config.useKeychain ? 'keychain' : 'session',
        },
      ]);
  
      console.log('Password received, attempting to decrypt');
      try {
        const credentials = await loadCredentials(password);
  
        // Handle password storage based on user choice
        if (rememberChoice === 'keychain') {
          await saveToKeychain(password);
          // Also update the config to use keychain if not already set
          if (!config.useKeychain) {
            await saveConfig({
              ...config,
              useKeychain: true,
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
      console.log('No credentials exist, prompting for new credentials');
      return promptForCredentials();
    }
  };