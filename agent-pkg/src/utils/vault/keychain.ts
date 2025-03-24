import chalk from 'chalk';
import keytar from 'keytar';
import { KEYCHAIN_ACCOUNT, KEYCHAIN_SERVICE } from '../../config/default.js';

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
