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
      spinner.fail('Project structure not recognized');
      console.log(chalk.yellow('Make sure you are in a valid Autonomys agent project directory.'));
      console.log(
        chalk.yellow(
          'The project should have a src/tools directory or be based on the Autonomys agent template.',
        ),
      );
      return {
        success: false,
        message: 'Could not detect project root. Make sure you are in the agent project directory.',
      };
    }

    spinner.text = `Looking for ${toolName}...`;
    const { toolInfo, versionDisplay } = await resolveToolInfo(toolName, options, spinner);

    spinner.text = `Installing ${toolName} ${versionDisplay}...`;
    const _install = await performToolInstallation(toolInfo, installDir);

    spinner.succeed(`Successfully installed ${toolName} ${versionDisplay}`);

    return {
      success: true,
      message: `Successfully installed ${toolName} ${versionDisplay}`,
    };
  } catch (error) {
    spinner.fail(`Failed to install ${toolName}`);
    let errorMessage = '';
    if (error instanceof Error) {
      if (error.message.includes('Tool validation failed')) {
        errorMessage = `Invalid tool structure: ${error.message}`;
      } else if (error.message.includes('not found in registry')) {
        errorMessage = `Tool '${toolName}' not found in registry. Check the name or try 'agent-os search' to find available tools.`;
      } else if (error.message.includes('ENOENT')) {
        errorMessage = `Directory access error: ${error.message}`;
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = String(error);
    }

    console.error(chalk.red(errorMessage));

    return {
      success: false,
      message: `Failed to install ${toolName}: ${errorMessage}`,
    };
  }
};

export { install };
