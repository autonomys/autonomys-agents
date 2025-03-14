import { pool } from '../db/index.js';
import { createLogger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as yaml from 'js-yaml';
import path from 'path';
import { fileURLToPath } from 'url';

const logger = createLogger('rename-argumint');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function renameArgumintInDatabase() {
  try {
    // Get count of records before update
    const countBefore = await pool.query("SELECT COUNT(*) FROM memory_records WHERE agent_name = '0xargumint'");
    logger.info(`Found ${countBefore.rows[0].count} records with agent_name = '0xargumint'`);

    // Run the update query
    await pool.query(`
      UPDATE memory_records
      SET agent_name = 'argumint'
      WHERE agent_name = '0xargumint'
    `);
    
    // Get count of records after update
    const countAfter = await pool.query("SELECT COUNT(*) FROM memory_records WHERE agent_name = 'argumint'");
    logger.info(`Updated ${countAfter.rows[0].count} records to agent_name = 'argumint'`);
    
    return countBefore.rows[0].count;
  } catch (error) {
    logger.error('Database update failed:', error);
    throw error;
  }
}

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
          logger.info(`Updating agent name from '0xargumint' to 'argumint' in config`);
          return { ...agent, username: 'argumint' };
        }
        return agent;
      });
      
      // Write the updated config back to the file
      const updatedYaml = yaml.dump(config);
      await fs.writeFile(configPath, updatedYaml, 'utf8');
      
      logger.info('Updated agents.yaml configuration successfully');
      return true;
    } else {
      logger.info('No update needed for agents.yaml configuration');
      return false;
    }
  } catch (error) {
    logger.error('Config update failed:', error);
    throw error;
  }
}

async function renameArgumint() {
  try {
    logger.info('Starting argumint rename process');
    
    // Update the database
    const recordsUpdated = await renameArgumintInDatabase();
    
    // Update the config file
    const configUpdated = await updateAgentConfig();
    
    logger.info('Argumint rename process completed', { 
      databaseRecordsUpdated: recordsUpdated,
      configUpdated
    });
  } catch (error) {
    logger.error('Rename process failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

renameArgumint().catch(error => {
  console.error('Error in rename process:', error);
  process.exit(1);
}); 