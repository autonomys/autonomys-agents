import { pool } from '../connection.js';
import { Tool, ToolVersion, ToolWithVersions, ToolWithLatestVersion } from '../../models/Tool.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('api-repository');

// Get all tools with pagination
export const getAllTools = async (
  page = 1,
  limit = 20,
  sortBy = 'created_at',
  sortOrder = 'desc',
): Promise<{
  tools: Tool[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  try {
    // Ensure valid sort parameters to prevent SQL injection
    const validSortColumns = ['created_at', 'updated_at', 'name'];
    const validSortOrders = ['asc', 'desc'];

    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const order = validSortOrders.includes(sortOrder.toLowerCase())
      ? sortOrder.toLowerCase()
      : 'desc';

    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM tools';
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    // Query tools with pagination
    const query = `
      SELECT id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
      created_at as "createdAt", updated_at as "updatedAt"
      FROM tools
      ORDER BY ${sortColumn} ${order}
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await pool.query(query, [limit, offset]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      tools: rows,
      total,
      page,
      pageSize: limit,
      totalPages,
    };
  } catch (error) {
    logger.error('Error getting all tools:', error);
    throw error;
  }
};

// Get tool by name
export const getToolByName = async (name: string): Promise<ToolWithVersions | null> => {
  try {
    const nameQuery = `
      SELECT id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
      created_at as "createdAt", updated_at as "updatedAt"
      FROM tools
      WHERE name = $1
    `;
    const { rows: toolRows } = await pool.query(nameQuery, [name]);

    if (toolRows.length === 0) {
      return null;
    }

    const tool = toolRows[0];

    // Get versions for this tool
    const versionsQuery = `
      SELECT id, tool_id as "toolId", major, minor, patch, 
      cid, metadata_cid as "metadataCid", 
      publisher_address as "publisherAddress", published_at as "publishedAt",
      created_at as "createdAt"
      FROM tool_versions
      WHERE tool_id = $1
      ORDER BY major DESC, minor DESC, patch DESC
    `;

    const { rows: versionRows } = await pool.query(versionsQuery, [tool.id]);

    return {
      ...tool,
      versions: versionRows,
    };
  } catch (error) {
    logger.error('Error getting tool by name:', error);
    throw error;
  }
};

// Get all versions for a tool by tool ID
export const getToolVersions = async (toolId: number): Promise<ToolVersion[]> => {
  try {
    const query = `
      SELECT id, tool_id as "toolId", major, minor, patch, 
      cid, metadata_cid as "metadataCid", 
      publisher_address as "publisherAddress", published_at as "publishedAt",
      created_at as "createdAt"
      FROM tool_versions
      WHERE tool_id = $1
      ORDER BY major DESC, minor DESC, patch DESC
    `;

    const { rows } = await pool.query(query, [toolId]);
    return rows;
  } catch (error) {
    logger.error('Error getting tool versions:', error);
    throw error;
  }
};



// Get the latest version for each tool
export const getLatestToolVersions = async (): Promise<
  {
    toolName: string;
    toolId: number;
    version: string;
    cid: string;
    publisherAddress: string;
    publishedAt: Date;
  }[]
> => {
  try {
    const query = `
      WITH ranked_versions AS (
        SELECT 
          t.id as tool_id,
          t.name as tool_name,
          tv.major,
          tv.minor,
          tv.patch,
          tv.cid,
          tv.publisher_address,
          tv.published_at,
          ROW_NUMBER() OVER (
            PARTITION BY t.id 
            ORDER BY tv.major DESC, tv.minor DESC, tv.patch DESC
          ) as rank
        FROM tools t
        JOIN tool_versions tv ON t.id = tv.tool_id
      )
      SELECT 
        tool_name as "toolName",
        tool_id as "toolId",
        concat(major, '.', minor, '.', patch) as version,
        cid,
        publisher_address as "publisherAddress",
        published_at as "publishedAt"
      FROM ranked_versions
      WHERE rank = 1
      ORDER BY tool_name
    `;

    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    logger.error('Error getting latest tool versions:', error);
    throw error;
  }
};

// Search tools by name
export const searchTools = async (searchTerm: string, limit = 10): Promise<ToolWithLatestVersion[]> => {
  try {
    const query = `
      WITH tool_results AS (
        SELECT id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
        created_at as "createdAt", updated_at as "updatedAt"
        FROM tools
        WHERE name ILIKE $1
        ORDER BY created_at DESC
        LIMIT $2
      ),
      latest_versions AS (
        SELECT 
          tv.tool_id,
          concat(tv.major, '.', tv.minor, '.', tv.patch) as version,
          tv.cid,
          tv.metadata_cid as "metadataCid",
          tv.publisher_address as "publisherAddress",
          tv.published_at as "publishedAt",
          ROW_NUMBER() OVER (
            PARTITION BY tv.tool_id 
            ORDER BY tv.major DESC, tv.minor DESC, tv.patch DESC
          ) as rank
        FROM tool_versions tv
        JOIN tool_results tr ON tv.tool_id = tr.id
      )
      SELECT 
        tr.*,
        lv.version,
        lv.cid,
        lv."metadataCid",
        lv."publisherAddress",
        lv."publishedAt"
      FROM tool_results tr
      LEFT JOIN latest_versions lv ON tr.id = lv.tool_id AND lv.rank = 1
    `;

    const { rows } = await pool.query(query, [`%${searchTerm}%`, limit]);
    return rows;
  } catch (error) {
    logger.error('Error searching tools:', error);
    throw error;
  }
};

// Get tools by publisher address
export const getToolsByPublisher = async (
  address: string,
  page = 1,
  limit = 20,
): Promise<{
  tools: Tool[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> => {
  try {
    // Calculate offset
    const offset = (page - 1) * limit;

    // Get total count
    const countQuery = 'SELECT COUNT(*) as total FROM tools WHERE owner_address = $1';
    const countResult = await pool.query(countQuery, [address]);
    const total = parseInt(countResult.rows[0].total);

    // Query tools with pagination
    const query = `
      SELECT id, name, name_hash as "nameHash", owner_address as "ownerAddress", 
      created_at as "createdAt", updated_at as "updatedAt"
      FROM tools
      WHERE owner_address = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(query, [address, limit, offset]);

    // Calculate total pages
    const totalPages = Math.ceil(total / limit);

    return {
      tools: rows,
      total,
      page,
      pageSize: limit,
      totalPages,
    };
  } catch (error) {
    logger.error('Error getting tools by publisher:', error);
    throw error;
  }
};
