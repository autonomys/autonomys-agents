import { loadConfig, saveConfig } from './index.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { Credentials } from '../types/index.js';
import { credentialsExist, loadCredentials, saveCredentials } from '../utils/credential/index.js';

const promptForConfig = async () => {
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
  ]);

  await saveConfig({ ...currentConfig, ...answers });
  console.log(chalk.green('Configuration saved successfully'));
};

const promptForCredentials = async (): Promise<Credentials> => {
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

    if (action === 'Use existing credentials') {
      try {
        const credentials = await loadCredentials();
        return credentials;
      } catch (error) {
        console.error(chalk.red('Failed to decrypt credentials. Please try again.', error));
        return await promptForCredentials();
      }
    }
    masterPassword = password;
  } else {
    const { password } = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Create a master password to secure your credentials:',
        mask: '*',
        validate: (input: string) => {
          if (input.length < 8) {
            return 'Password must be at least 8 characters long';
          }
          return true;
        },
      },
      {
        type: 'password',
        name: 'confirmPassword',
        message: 'Confirm master password:',
        mask: '*',
        validate: (input: string, answers: { password: string }) => {
          if (input !== answers.password) {
            return 'Passwords do not match';
          }
          return true;
        },
      },
    ]);
    masterPassword = password;

    console.log(
      chalk.green('Your master password will be securely stored in the system keychain.'),
    );
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

  await saveCredentials(credentials, masterPassword);
  console.log(chalk.green('Credentials saved successfully'));

  const currentConfig = await loadConfig();
  await saveConfig({
    ...currentConfig,
    autoSaveCredentials: true,
  });

  return credentials;
};

export { promptForConfig, promptForCredentials };
