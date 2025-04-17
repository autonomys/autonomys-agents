import chalk from 'chalk';
import { CommandResult, ToolMetadata } from '../types/index.js';
import { getRegistry } from '../utils/commands/registry/toolInquiry.js';

const list = async (): Promise<CommandResult> => {
  // TODO - This should get updated with reading the data from web-server
  console.log(chalk.blue('Fetching available tools from registry...'));

  try {
    const registry = await getRegistry();
    const tools = Object.values(registry.tools) as ToolMetadata[];

    if (tools.length === 0) {
      console.log(chalk.yellow('No tools found in the registry.'));
      return { success: true, message: 'No tools found in the registry.' };
    }

    console.log(chalk.green(`\n${tools.length} tools available:`));

    tools.forEach(tool => {
      console.log(`\n${chalk.bold(tool.name)} (${tool.version})`);
    });

    return {
      success: true,
      message: `Listed ${tools.length} tools`,
      data: { tools },
    };
  } catch (error) {
    console.error(
      chalk.red(
        `Error fetching registry: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return { success: false, message: `Error fetching registry: ${error}` };
  }
};

export { list };
