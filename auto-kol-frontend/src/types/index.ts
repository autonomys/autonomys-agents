export interface Tweet {
    id: string
    text: string
    authorId: string
    authorUsername: string
    createdAt: string
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
    tweet: Tweet
    reason: string
    priority: number
    createdAt: string
    workflowState: any
} 