export interface AgentMemory {
    previousCid: string | null
    updatedResponse: {
        response: {
            id: string
            tweet_id: string
            content: string
            tone: string
            strategy: string
        }
        status: string
        tweet: {
            author_id: string
            author_username: string
            content: string
            created_at: string
            id: string
            processed_at: string
        }
    }
    tweetId: string
    feedback: string | null
    timestamp: string
}

export interface Agent {
    id: string
    name: string
    profileUrl: string
}

export interface DSNData {
    id: string
    tweet_id: string
    kol_username: string
    cid: string
    response_id: string
    created_at: string
    author_username: string
    tweet_content: string
    response_content: string
} 