import chalk from 'chalk';
import { getToolMetadata } from '../utils/commands/registry/toolInquiry.js';
import { getToolVersions } from '../utils/blockchain/contractClient.js';
import { ToolCommandParams } from '../types/index.js';

const tool = async (params: ToolCommandParams): Promise<void> => {
  const { name, version, action } = params;

  if (version && action === 'metadata') {
    const metadata = await getToolMetadata(name, version);
    if (metadata) {
      console.log(chalk.green(`Metadata for ${name} version ${version}:`));
      console.log(metadata);
    } else {
      console.log(chalk.red(`Metadata not found for tool ${name} version ${version}`));
    }
  } else if (version && !action) {
    const metadata = await getToolMetadata(name, version);
    if (metadata) {
      console.log(chalk.green(`Metadata for ${name} version ${version}:`));
      console.log(metadata);
    } else {
      console.log(chalk.red(`Metadata not found for tool ${name} version ${version}`));
    }
  } else {
    try {
      const versions = await getToolVersions(name);
      if (versions && versions.length > 0) {
        console.log(chalk.green(`Available versions for ${name}:`));
        versions.forEach(v => console.log(`- ${v}`));
      } else {
        console.log(chalk.yellow(`No versions found for tool ${name}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error retrieving versions for ${name}:`), error);
    }
  }
};

export { tool };
