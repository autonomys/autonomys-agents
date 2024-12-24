CREATE TABLE IF NOT EXISTS kol_accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tweets (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS responses (
    id TEXT PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    content TEXT NOT NULL,
    tone TEXT NOT NULL,
    strategy TEXT NOT NULL,
    estimated_impact INTEGER CHECK(estimated_impact BETWEEN 1 AND 10),
    confidence REAL CHECK(confidence BETWEEN 0 AND 1),
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);

CREATE TABLE IF NOT EXISTS skipped_tweets (
    id TEXT PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    confidence REAL CHECK(confidence BETWEEN 0 AND 1),
    recheck BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);
 
CREATE TABLE IF NOT EXISTS dsn (
    id TEXT PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    cid TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mentions (
    latest_id TEXT PRIMARY KEY,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trends (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS top_level_tweets (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kol_accounts_username ON kol_accounts(username);
CREATE INDEX idx_tweets_created_at ON tweets(created_at);
CREATE INDEX idx_responses_status ON responses(status);
CREATE INDEX idx_skipped_tweets_created_at ON skipped_tweets(created_at);