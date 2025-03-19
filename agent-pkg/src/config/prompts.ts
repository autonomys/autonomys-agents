import { saveConfig } from ".";
import chalk from "chalk";
import { loadConfig } from ".";
import inquirer from "inquirer";
import { Credentials } from "../types/index.js";
import { credentialsExist, loadCredentials, saveCredentials } from "../utils/credential/index.js";
import { saveToKeychain, deleteFromKeychain } from "../utils/vault/keychain.js";
import { cachePassword } from "../utils/vault/cache.js";


/**
 * Prompt user for required configuration
 */
export const promptForConfig = async () => {
    console.log(chalk.blue('Configuration setup for autoOS CLI'));
  
    const currentConfig = await loadConfig();
  
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'autoDriveNetwork',
        message: 'Select Autonomys Auto Drive network:',
        choices: ['mainnet', 'taurus'],
        default: currentConfig.autoDriveNetwork,
      },
      {
        type: 'input',
        name: 'taurusRpcUrl',
        message: 'Taurus RPC URL:',
        default: currentConfig.taurusRpcUrl,
      },
      {
        type: 'input',
        name: 'packageRegistryAddress',
        message: 'Package Registry contract address:',
        default: currentConfig.packageRegistryAddress,
      },
      {
        type: 'confirm',
        name: 'useKeychain',
        message: 'Store master password in system keychain?',
        default: currentConfig.useKeychain === undefined ? true : currentConfig.useKeychain,
      },
    ]);
  
    // If keychain setting changed from true to false, remove any existing keychain entry
    if (currentConfig.useKeychain && !answers.useKeychain) {
      await deleteFromKeychain();
    }
  
    await saveConfig({ ...currentConfig, ...answers });
    console.log(chalk.green('Configuration saved successfully'));
  };
  
  /**
   * Prompt user for required credentials
   */
  export const promptForCredentials = async (): Promise<Credentials> => {
    console.log(chalk.blue('Credential setup for autoOS CLI'));
  
    const hasExistingCredentials = await credentialsExist();
    let masterPassword: string;
  
    if (hasExistingCredentials) {
      const { password, action } = await inquirer.prompt([
        {
          type: 'password',
          name: 'password',
          message: 'Enter your master password:',
          mask: '*',
        },
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: ['Update credentials', 'Use existing credentials'],
          default: 'Use existing credentials',
        },
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
          return await promptForCredentials();
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
          },
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
          },
        },
        {
          type: 'confirm',
          name: 'useKeychain',
          message: 'Store master password in system keychain?',
          default: true,
        },
      ]);
  
      masterPassword = password;
  
      // Update config with keychain preference
      const currentConfig = await loadConfig();
      await saveConfig({
        ...currentConfig,
        useKeychain,
      });
    }
  
    // Prompt for credentials
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'autoDriveApiKey',
        message: 'Autonomys Auto Drive API Key:',
        validate: (input: string) => input.trim() !== '' || 'API Key is required',
      },
      {
        type: 'password',
        name: 'autoDriveEncryptionPassword',
        message: 'Auto Drive Encryption Password (optional):',
        mask: '*',
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
        },
      },
      {
        type: 'confirm',
        name: 'saveCredentials',
        message: 'Save these credentials for future use?',
        default: true,
      },
    ]);
  
    const credentials: Credentials = {
      autoDriveApiKey: answers.autoDriveApiKey,
      autoDriveEncryptionPassword: answers.autoDriveEncryptionPassword || undefined,
      autoEvmPrivateKey: answers.autoEvmPrivateKey,
    };
  
    if (answers.saveCredentials) {
      await saveCredentials(credentials, masterPassword);
      console.log(chalk.green('Credentials saved successfully'));
  
      // Update config
      const currentConfig = await loadConfig();
      await saveConfig({
        ...currentConfig,
        autoSaveCredentials: true,
      });
    }
  
    return credentials;
  };
  
  