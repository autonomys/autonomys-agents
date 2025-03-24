import chalk from 'chalk';
import ora from 'ora';
import { CommandResult } from '../types/index.js';
import { InstallOptions } from '../types/index.js';
import { performToolInstallation, resolveToolInfo } from '../utils/commands/install/toolInstall.js';

const install = async (toolName: string, options: InstallOptions): Promise<CommandResult> => {
  const spinner = ora(`Installing ${toolName}...`).start();
  const isLocalInstall = !!options.local;
  const installType = isLocalInstall ? 'locally' : 'globally';

  try {
    const { toolInfo, versionDisplay } = await resolveToolInfo(toolName, options, spinner);

    await performToolInstallation(toolInfo, isLocalInstall);

    spinner.succeed(`Successfully installed ${toolName} ${versionDisplay} ${installType}`);

    return {
      success: true,
      message: `Successfully installed ${toolName} ${versionDisplay} ${installType}`,
    };
  } catch (error) {
    spinner.fail(`Failed to install ${toolName}`);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(errorMessage));

    return {
      success: false,
      message: `Failed to install ${toolName}: ${errorMessage}`,
    };
  }
};

export { install };
