import fs from 'fs/promises';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { Credentials } from '../../types/index.js';
import { CREDENTIALS_FILE } from '../shared/path.js';
import { loadConfig, saveConfig } from '../../config/index.js';
import { saveToKeychain, getFromKeychain, deleteFromKeychain } from '../vault/keychain.js';
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

  // Always save to keychain
  await saveToKeychain(masterPassword);
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

    // First try to get the password from keychain
    const keychainPassword = await getFromKeychain();
    if (keychainPassword) {
      console.log('Using master password from system keychain');
      try {
        const credentials = await loadCredentials(keychainPassword);
        return credentials;
      } catch (error) {
        console.error(
          chalk.red('System keychain password is no longer valid. Will prompt for password.'),
        );
        // Remove invalid password from keychain
        await deleteFromKeychain();
      }
    }

    // Prompt the user interactively
    console.log('Prompting for master password');
    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter your master password:',
        mask: '*',
      },
    ]);

    console.log('Password received, attempting to decrypt');
    try {
      const credentials = await loadCredentials(password);

      // Always save to keychain
      await saveToKeychain(password);

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
