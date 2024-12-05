CREATE TABLE kor_accounts (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL
);

CREATE TABLE tweets (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    author_username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    engagement_status TEXT CHECK(engagement_status IN ('pending', 'engaged', 'skipped')) NOT NULL
);

CREATE TABLE pending_responses (
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

CREATE TABLE skipped_tweets (
    id TEXT PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    confidence REAL CHECK(confidence BETWEEN 0 AND 1),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tweet_id) REFERENCES tweets(id)
);

CREATE TABLE sent_responses (
    id TEXT PRIMARY KEY,
    tweet_id TEXT NOT NULL,
    response_id TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    engagement_metrics TEXT, -- JSON string for likes, retweets, etc.
    FOREIGN KEY (tweet_id) REFERENCES tweets(id),
    FOREIGN KEY (response_id) REFERENCES pending_responses(id)
);

CREATE TABLE feedback (
    id TEXT PRIMARY KEY,
    response_id TEXT NOT NULL,
    feedback_type TEXT CHECK(feedback_type IN ('approve', 'reject', 'improve')) NOT NULL,
    feedback_content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (response_id) REFERENCES pending_responses(id)
);

CREATE INDEX idx_kor_accounts_username ON kor_accounts(username);
CREATE INDEX idx_tweets_created_at ON tweets(created_at);
CREATE INDEX idx_pending_responses_status ON pending_responses(status);
CREATE INDEX idx_pending_responses_tweet_id ON pending_responses(tweet_id);
CREATE INDEX idx_skipped_tweets_created_at ON skipped_tweets(created_at);
