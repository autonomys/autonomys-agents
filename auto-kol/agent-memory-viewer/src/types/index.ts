export interface AgentMemory {
    decision: {
        shouldEngage: boolean
        reason: string
        priority: number
        confidence: number
    }
    tweet: {
        id: string
        text: string
        author_id: string
        author_username: string
        created_at: string
    }
    previousCid: string | null
    signature: string
    timestamp: string
}

export interface Agent {
    id: string
    name: string
    profileUrl: string
}

export interface DSNResponse {
    data: DSNData[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
}

export interface DSNData {
    id: string
    tweet_id: string
    cid: string
    created_at: string
    author_username: string
    tweet_content: string
    response_content: string
    result_type: string
    skip_reason: string
    response_status: string
} 