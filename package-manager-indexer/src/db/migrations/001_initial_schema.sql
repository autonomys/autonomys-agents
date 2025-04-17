-- Create tools table to store tool information
CREATE TABLE IF NOT EXISTS tools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  name_hash BYTEA NOT NULL UNIQUE,
  owner_address VARCHAR(42) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create versions table to store tool versions
CREATE TABLE IF NOT EXISTS tool_versions (
  id SERIAL PRIMARY KEY,
  tool_id INTEGER NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  major INTEGER NOT NULL,
  minor INTEGER NOT NULL,
  patch INTEGER NOT NULL,
  cid_hash BYTEA NOT NULL,
  metadata_hash BYTEA NOT NULL,
  publisher_address VARCHAR(42) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(tool_id, major, minor, patch)
);

-- Create an index on name_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_tools_name_hash ON tools(name_hash);

-- Create an index on tool versions for querying latest versions
CREATE INDEX IF NOT EXISTS idx_tool_versions_tool_id_version ON tool_versions(tool_id, major, minor, patch);

-- Create an index on publisher address for filtering tools by owner
CREATE INDEX IF NOT EXISTS idx_tools_owner_address ON tools(owner_address);

-- Create a table to track the latest processed block
CREATE TABLE IF NOT EXISTS indexer_state (
  id SERIAL PRIMARY KEY,
  last_processed_block BIGINT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert initial indexer state if not exists
INSERT INTO indexer_state (last_processed_block, updated_at)
VALUES (0, NOW())
ON CONFLICT DO NOTHING; 