import chalk from 'chalk';
import ora from 'ora';
import { CommandResult } from '../types/index.js';
import { InstallOptions } from '../types/index.js';
import { performToolInstallation } from '../utils/commands/install/toolInstall.js';
import { getToolInstallDir } from '../utils/shared/path.js';
import { resolveToolInfo } from '../utils/commands/install/utils.js';

const install = async (toolName: string, options: InstallOptions): Promise<CommandResult> => {
  const spinner = ora(`Installing ${toolName}...`).start();
  try {
    const { installDir } = await getToolInstallDir();
    if (!installDir) {
      throw new Error(
        'Could not detect project root. Make sure you are in the agent project directory.',
      );
    }
    const { toolInfo, versionDisplay } = await resolveToolInfo(toolName, options, spinner);

    const _install = await performToolInstallation(toolInfo, installDir);

    spinner.succeed(`Successfully installed ${toolName} ${versionDisplay}`);

    return {
      success: true,
      message: `Successfully installed ${toolName} ${versionDisplay}`,
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
