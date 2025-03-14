-- Rename agent from '0xargumint' to 'argumint'
UPDATE memory_records
SET agent_name = 'argumint'
WHERE agent_name = '0xargumint';

-- Log the migration
INSERT INTO migrations (name, applied_at)
VALUES ('003_rename_argumint_agent', NOW())
ON CONFLICT (name) DO NOTHING; 