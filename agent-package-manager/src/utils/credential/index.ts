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
      throw new Error('No master password found in keychain');
    }
    const encryptedData = await fs.readFile(CREDENTIALS_FILE);
    const credentials = await decryptCredentials(encryptedData, masterPassword);
    return credentials;
  } catch (error) {
    console.log('Error loading credentials:', error);
    return {};
  }
};

const credentialsExist = async (): Promise<boolean> => {
  try {
    await fs.access(CREDENTIALS_FILE);
    return true;
  } catch (error) {
    console.error('Error checking if credentials exist:', error);
    return false;
  }
};

export { saveCredentials, loadCredentials, credentialsExist };
