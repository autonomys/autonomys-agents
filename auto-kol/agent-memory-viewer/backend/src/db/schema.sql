CREATE TABLE IF NOT EXISTS memory_records (
    id SERIAL PRIMARY KEY,
    cid VARCHAR(255) NOT NULL,
    previous_cid VARCHAR(255),
    content JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cid)
); 