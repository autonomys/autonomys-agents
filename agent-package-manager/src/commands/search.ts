import chalk from 'chalk';
import { CommandResult } from '../types/index.js';
import axios from 'axios';
import { loadConfig } from '../config/index.js';

const search = async (searchTerm = ''): Promise<CommandResult> => {
  try {
    const config = await loadConfig();
    const indexerUrl = config.indexerUrl;
    if (!indexerUrl || indexerUrl === '') {
      throw new Error('Search is not available.');
    }
    console.log(
      chalk.blue(`Searching for tools${searchTerm ? ` matching "${searchTerm}"` : ''}...`),
    );

    // Make API call to indexer's search endpoint
    const endpoint = searchTerm 
      ? `${indexerUrl}/tools/search?q=${encodeURIComponent(searchTerm)}&limit=20` 
      : `${indexerUrl}/tools/latest`;
    
    const response = await axios.get(endpoint);
    const tools = response.data.data || [];
    
    if (tools.length === 0) {
      const message = searchTerm 
        ? `No tools found matching "${searchTerm}".` 
        : 'No tools found in the registry.';
      console.log(chalk.yellow(message));
      return { success: true, message };
    }

    console.log(chalk.green(`\n${tools.length} tools found:`));

    tools.forEach((tool: any) => {
      // Format based on whether it's from search or latest endpoint
      const toolName = tool.name || tool.toolName;
      const version = tool.version || '(version unknown)';
      console.log(`\n${chalk.bold(toolName)} (${version})`);
    });

    return {
      success: true,
      message: `Listed ${tools.length} tools`,
      data: { tools },
    };
  } catch (error) {
    console.error(
      chalk.red(
        `Error searching tools: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
    return { success: false, message: `Error searching tools: ${error}` };
  }
};

export { search };
