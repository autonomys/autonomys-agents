ALTER TABLE memory_records
ADD COLUMN agent_name VARCHAR(255) NOT NULL DEFAULT 'default_agent';

-- Update existing records with the current agent name from config
UPDATE memory_records
SET agent_name = 'argumint';

-- Add an index for better query performance
CREATE INDEX idx_agent_name ON memory_records(agent_name); 