CREATE TABLE IF NOT EXISTS memory_records (
    id SERIAL PRIMARY KEY,
    cid VARCHAR(255) NOT NULL,
    previous_cid VARCHAR(255),
    content JSONB,
    agent_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cid)
); 

CREATE TABLE IF NOT EXISTS path_cache (
    path TEXT PRIMARY KEY,
    hits INTEGER DEFAULT 1,
    success_count INTEGER DEFAULT 0,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for querying effective paths
CREATE INDEX idx_path_success_rate ON path_cache((success_count::float / NULLIF(hits, 0)));

INSERT INTO path_cache (path) VALUES
    ('content->''text'''),
    ('content->''tweet''->>''text'''),
    ('content->''data''->>''text'''),
    ('content->''tweet''->>''username''')
ON CONFLICT (path) DO NOTHING; 