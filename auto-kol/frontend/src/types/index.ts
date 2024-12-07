export interface Tweet {
    tweet_id: string
    tweet_content: string
    author_username: string
    created_at: string
}

export interface PendingResponse {
    id: string
    tweet: Tweet
    response: {
        content: string
    }
    status: 'pending' | 'approved' | 'rejected'
    createdAt: string
    updatedAt: string
    workflowState: any
}

export interface SkippedTweet {
    id: string
    tweet_id: string
    tweet_content: string
    author_username: string
    reason: string
    confidence: number
    created_at: string
} 