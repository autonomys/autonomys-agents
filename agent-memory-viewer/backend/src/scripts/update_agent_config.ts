import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('update-agent-config');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateAgentConfig() {
  try {
    const configPath = path.join(__dirname, '../config/agents.yaml');
    
    // Read the current config
    const fileContents = await fs.readFile(configPath, 'utf8');
    const config = yaml.load(fileContents) as { 
      contractAddress: string;
      agents: { username: string; address: string }[];
    };
    
    // Check if we need to update
    const needsUpdate = config.agents.some(agent => agent.username === '0xargumint');
    
    if (needsUpdate) {
      // Update the agent name
      config.agents = config.agents.map(agent => {
        if (agent.username === '0xargumint') {
          logger.info(`Updating agent name from '0xargumint' to 'argumint'`);
          return { ...agent, username: 'argumint' };
        }
        return agent;
      });
      
      // Write the updated config back to the file
      const updatedYaml = yaml.dump(config);
      await fs.writeFile(configPath, updatedYaml, 'utf8');
      
      logger.info('Updated agents.yaml configuration successfully');
    } else {
      logger.info('No update needed for agents.yaml configuration');
    }
  } catch (error) {
    logger.error('Failed to update agent configuration:', error);
    throw error;
  }
}

updateAgentConfig().catch(error => {
  console.error('Error updating agent configuration:', error);
  process.exit(1);
}); 