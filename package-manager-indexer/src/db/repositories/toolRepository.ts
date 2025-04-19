import { pool } from '../connection.js';
import { Tool, ToolVersion, Version, nameToHash } from '../../models/Tool.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('tool-repository');

// Save a new tool to the database
export const saveTool = async (
  name: string,
  nameHash: Buffer | string,
  ownerAddress: string,
): Promise<Tool> => {
  try {
    // Convert nameHash to Buffer if it's a string
    const nameHashBuffer = typeof nameHash === 'string' ? nameToHash(nameHash) : nameHash;

    const query = `
      INSERT INTO tools (name, name_hash, owner_address)
      VALUES ($1, $2, $3)
      RETURNING id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
      created_at as "createdAt", updated_at as "updatedAt"
    `;
    const { rows } = await pool.query(query, [name, nameHashBuffer, ownerAddress]);
    return rows[0];
  } catch (error) {
    logger.error('Error saving tool:', error);
    throw error;
  }
};

// Update tool owner
export const updateToolOwner = async (
  nameHash: Buffer | string,
  newOwnerAddress: string,
): Promise<Tool | null> => {
  try {
    // Convert nameHash to Buffer if it's a string
    const nameHashBuffer = typeof nameHash === 'string' ? nameToHash(nameHash) : nameHash;

    const query = `
      UPDATE tools
      SET owner_address = $1, updated_at = NOW()
      WHERE name_hash = $2
      RETURNING id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
      created_at as "createdAt", updated_at as "updatedAt"
    `;
    const { rows } = await pool.query(query, [newOwnerAddress, nameHashBuffer]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Error updating tool owner:', error);
    throw error;
  }
};

// Update tool name
export const updateToolName = async (id: number, newName: string): Promise<Tool | null> => {
  try {
    const query = `
      UPDATE tools
      SET name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
      created_at as "createdAt", updated_at as "updatedAt"
    `;
    const { rows } = await pool.query(query, [newName, id]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Error updating tool name:', error);
    throw error;
  }
};

// Get tool by name hash
export const getToolByNameHash = async (nameHash: Buffer | string): Promise<Tool | null> => {
  try {
    // Convert nameHash to Buffer if it's a string
    const nameHashBuffer = typeof nameHash === 'string' ? nameToHash(nameHash) : nameHash;

    const query = `
      SELECT id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
      created_at as "createdAt", updated_at as "updatedAt"
      FROM tools
      WHERE name_hash = $1
    `;
    const { rows } = await pool.query(query, [nameHashBuffer]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Error getting tool by name hash:', error);
    throw error;
  }
};

// Save a new tool version
export const saveToolVersion = async (
  toolId: number,
  version: Version,
  cid: string,
  metadataCid: string,
  publisherAddress: string,
  publishedAt: Date,
): Promise<ToolVersion> => {
  try {
    const query = `
      INSERT INTO tool_versions (
        tool_id, major, minor, patch, 
        cid, metadata_cid, publisher_address, published_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, tool_id as "toolId", major, minor, patch, 
      cid, metadata_cid as "metadataCid", 
      publisher_address as "publisherAddress", published_at as "publishedAt",
      created_at as "createdAt"
    `;
    const values = [
      toolId,
      version.major,
      version.minor,
      version.patch,
      cid,
      metadataCid,
      publisherAddress,
      publishedAt,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  } catch (error) {
    logger.error('Error saving tool version:', error);
    throw error;
  }
};

// Update a tool version's metadata
export const updateToolVersionMetadata = async (
  toolId: number,
  version: Version,
  metadataCid: string,
): Promise<ToolVersion | null> => {
  try {
    const query = `
      UPDATE tool_versions
      SET metadata_cid = $1
      WHERE tool_id = $2 AND major = $3 AND minor = $4 AND patch = $5
      RETURNING id, tool_id as "toolId", major, minor, patch, 
      cid, metadata_cid as "metadataCid", 
      publisher_address as "publisherAddress", published_at as "publishedAt",
      created_at as "createdAt"
    `;
    const values = [metadataCid, toolId, version.major, version.minor, version.patch];
    const { rows } = await pool.query(query, values);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    logger.error('Error updating tool version metadata:', error);
    throw error;
  }
};

// Check if a tool version exists
export const doesToolVersionExist = async (toolId: number, version: Version): Promise<boolean> => {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM tool_versions
      WHERE tool_id = $1 AND major = $2 AND minor = $3 AND patch = $4
    `;
    const values = [toolId, version.major, version.minor, version.patch];
    const { rows } = await pool.query(query, values);
    return parseInt(rows[0].count) > 0;
  } catch (error) {
    logger.error('Error checking if tool version exists:', error);
    throw error;
  }
};

// Get the latest block processed by the indexer
export const getLastProcessedBlock = async (): Promise<number> => {
  try {
    const query = `
      SELECT last_processed_block
      FROM indexer_state
      ORDER BY id DESC
      LIMIT 1
    `;
    const { rows } = await pool.query(query);
    return rows.length > 0 ? parseInt(rows[0].last_processed_block) : 0;
  } catch (error) {
    logger.error('Error getting last processed block:', error);
    throw error;
  }
};

// Update the last processed block
export const updateLastProcessedBlock = async (blockNumber: number): Promise<void> => {
  try {
    const query = `
      UPDATE indexer_state
      SET last_processed_block = $1, updated_at = NOW()
      WHERE id = (SELECT id FROM indexer_state ORDER BY id DESC LIMIT 1)
    `;
    await pool.query(query, [blockNumber]);
    logger.debug(`Updated last processed block to ${blockNumber}`);
  } catch (error) {
    logger.error('Error updating last processed block:', error);
    throw error;
  }
};

// Reset the last processed block to a specific value (default 0)
export const resetLastProcessedBlock = async (blockNumber: number = 0): Promise<void> => {
  try {
    const query = `
      UPDATE indexer_state
      SET last_processed_block = $1, updated_at = NOW()
      WHERE id = (SELECT id FROM indexer_state ORDER BY id DESC LIMIT 1)
    `;
    await pool.query(query, [blockNumber]);
    logger.info(`Reset last processed block to ${blockNumber}`);
  } catch (error) {
    logger.error('Error resetting last processed block:', error);
    throw error;
  }
};
