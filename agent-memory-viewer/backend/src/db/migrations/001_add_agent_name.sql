ALTER TABLE memory_records
ADD COLUMN agent_name VARCHAR(255) NOT NULL DEFAULT 'default_agent';


UPDATE memory_records
SET agent_name = '0xargumint';

CREATE INDEX idx_agent_name ON memory_records(agent_name); 