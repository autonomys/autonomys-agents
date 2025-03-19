import chalk from 'chalk';
import keytar from 'keytar';
import { KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT } from '../../config/default.js';

/**
 * Save the master password to the system keychain
 */
const saveToKeychain = async (password: string): Promise<boolean> => {
  try {
    await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, password);
    return true;
  } catch (error) {
    console.log(
      chalk.yellow('Unable to save to system keychain. In-memory caching will be used instead.'),
    );
    console.log(chalk.gray(`Error: ${error}`));
    return false;
  }
};

/**
 * Get the master password from the system keychain
 */
const getFromKeychain = async (): Promise<string | null> => {
  try {
    const password = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
    return password;
  } catch (error) {
    console.log(chalk.yellow('Unable to access system keychain. Falling back to other methods.'));
    console.log(chalk.gray(`Error: ${error}`));
    return null;
  }
};

/**
 * Delete the master password from the system keychain
 */
const deleteFromKeychain = async (): Promise<boolean> => {
  try {
    return await keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
  } catch (error) {
    console.log(chalk.yellow('Unable to remove from system keychain.'));
    console.log(chalk.gray(`Error: ${error}`));
    return false;
  }
};

export { saveToKeychain, getFromKeychain, deleteFromKeychain };