import fs from 'fs/promises';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { Credentials } from '../../types/index.js';
import { CREDENTIALS_FILE } from '../shared/path.js';
import { getFromKeychain, saveToKeychain } from '../vault/keychain.js';

const encryptCredentials = async (
  credentials: Credentials,
  masterPassword: string,
): Promise<Buffer> => {
  const salt = randomBytes(16);
  const key = scryptSync(masterPassword, salt, 32);
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);

  const data = JSON.stringify(credentials);
  const encrypted = Buffer.concat([salt, iv, cipher.update(data, 'utf8'), cipher.final()]);

  return encrypted;
};

const decryptCredentials = async (
  encryptedData: Buffer,
  masterPassword: string,
): Promise<Credentials> => {
  try {
    const salt = encryptedData.subarray(0, 16);
    const iv = encryptedData.subarray(16, 32);
    const encryptedCredentials = encryptedData.subarray(32);

    const key = scryptSync(masterPassword, salt, 32);
    const decipher = createDecipheriv('aes-256-cbc', key, iv);

    const decrypted = Buffer.concat([
      decipher.update(encryptedCredentials),
      decipher.final(),
    ]).toString('utf8');

    return JSON.parse(decrypted) as Credentials;
  } catch (error) {
    throw new Error(`Failed to decrypt credentials. Incorrect password? ${error}`);
  }
};

const saveCredentials = async (credentials: Credentials, masterPassword: string) => {
  const encrypted = await encryptCredentials(credentials, masterPassword);
  await fs.writeFile(CREDENTIALS_FILE, encrypted);
  await saveToKeychain(masterPassword);
};

const loadCredentials = async (): Promise<Credentials> => {
  try {
    const masterPassword = await getFromKeychain();
    if (!masterPassword) {
      throw new Error(
        'No master password found in keychain. Please run "autoOS config --credentials" to set up.',
      );
    }

    try {
      const encryptedData = await fs.readFile(CREDENTIALS_FILE);
      const credentials = await decryptCredentials(encryptedData, masterPassword);
      return credentials;
    } catch (error) {
      // Handle file not found error with a clearer message
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(
          'No credentials file found. Please run "autoOS config --credentials" to set up.',
        );
      }
      throw error;
    }
  } catch (error) {
    // Don't log the full error, just return empty credentials
    if (error instanceof Error) {
      throw new Error(`Failed to load credentials: ${error.message}`);
    }
    throw new Error('Failed to load credentials');
  }
};

const credentialsExist = async (): Promise<boolean> => {
  try {
    await fs.access(CREDENTIALS_FILE);
    return true;
  } catch {
    // Silently return false if the file doesn't exist
    // This is expected behavior when credentials haven't been set up yet
    return false;
  }
};

export { saveCredentials, loadCredentials, credentialsExist };
