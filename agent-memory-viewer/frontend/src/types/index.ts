import { ResponseStatus } from './enums';
interface AutoFeedback {
    response: string;
    reason: string;
    suggestedChanges: string;
}
export interface Tweet {
    id: string;
    text: string;
    author_id: string;
    author_username: string;
    created_at: string;
    mention?: boolean;
    thread?: Array<Tweet>;
    quotedStatus?: {
        id: string;
        text: string;
        username: string;
    }
}

export interface WorkflowDecision {
    shouldEngage: boolean;
    reason: string;
    priority: number;
    confidence: number;
}

export interface WorkflowToneAnalysis {
    dominantTone: string;
    suggestedTone: string;
    reasoning: string;
    confidence: number;
}

export interface WorkflowResponseStrategy {
    tone: string;
    strategy: string;
    referencedTweets: {
        text: string;
        reason: string;
        similarity_score: number;
    }[];
    confidence: number;
}

export interface BaseMemory {
    tweet: {
        id: string;
        text: string;
        author_id: string;
        author_username: string;
        created_at: string;
        thread?: Array<Tweet>;
        quotedStatus?: {
            id: string;
            text: string;
            username: string;
        }
    };
    previousCid: string | null;
    signature: string;
    timestamp: string;
}

export interface SkippedMemory extends BaseMemory {
    type: 'skipped';
    decision: WorkflowDecision;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: null;
        responseStrategy: null;
    };
    mentions: Tweet[];
    agentVersion: string;
}

export interface ApprovedMemory extends BaseMemory {
    type: 'approved';
    agentVersion: string;
    response: string;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: WorkflowToneAnalysis;
        responseStrategy: WorkflowResponseStrategy;
    };
    mentions: Tweet[];
    thread: Tweet[];
}

export interface RejectedMemory extends BaseMemory {
    type: 'rejected';
    response: string;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: WorkflowToneAnalysis;
        responseStrategy: WorkflowResponseStrategy;
        autoFeedback: AutoFeedback[];
    };
    mentions: Tweet[];
    agentVersion: string;
    retry: number;
}

export interface PostedMemory extends BaseMemory {
    type: 'posted';
    agentVersion: string;
}

export type AgentMemory = 
    | SkippedMemory 
    | RejectedMemory 
    | ApprovedMemory
    | PostedMemory;

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
    timestamp: string
    author_username: string
    tweet_content: string
    response_content: string
    result_type: string
    skip_reason: string
    response_status: ResponseStatus | null
    auto_feedback: {
        reason: string;
        suggestedChanges: string;
    } | null;
} 