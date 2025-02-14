CREATE TABLE IF NOT EXISTS path_cache (
    path TEXT PRIMARY KEY,
    hits INTEGER DEFAULT 1,
    success_count INTEGER DEFAULT 0,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_path_success_rate ON path_cache((success_count::float / NULLIF(hits, 0)));

INSERT INTO path_cache (path) VALUES
    ('content->''text'''),              -- Keep as JSONB if it's an object
    ('content->>''text'''),             -- Use if it's a direct text value
    ('content->''tweet''->>''text'''),  -- Correct for nested text
    ('content->''data''->>''text'''),   -- Correct for nested text
    ('content->>''content'''),          -- Direct text content
    ('content->''tweet''->>''username''') -- Correct for nested username
ON CONFLICT (path) DO NOTHING;