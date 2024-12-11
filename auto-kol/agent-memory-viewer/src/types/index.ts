interface WorkflowDecision {
    shouldEngage: boolean;
    reason: string;
    priority: number;
    confidence: number;
}

interface WorkflowToneAnalysis {
    dominantTone: string;
    suggestedTone: string;
    reasoning: string;
    confidence: number;
}

interface WorkflowResponseStrategy {
    tone: string;
    strategy: string;
    referencedTweets: {
        text: string;
        reason: string;
        similarity_score: number;
    }[];
    confidence: number;
}

interface BaseMemory {
    tweet: {
        id: string;
        text: string;
        author_id: string;
        author_username: string;
        created_at: string;
    };
    previousCid: string | null;
    signature: string;
    timestamp: string;
}

interface SkippedMemory extends BaseMemory {
    type: 'skipped';
    decision: WorkflowDecision;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: null;
        responseStrategy: null;
    };
}

interface ResponseMemory extends BaseMemory {
    type: 'response';
    response: string;
    workflowState: {
        toneAnalysis: WorkflowToneAnalysis;
        responseStrategy: WorkflowResponseStrategy;
    };
}

export type AgentMemory = SkippedMemory | ResponseMemory;

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