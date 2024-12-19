import { ResponseStatus } from './enums';

interface Tweet {
    id: string;
    text: string;
    author_id: string;
    author_username: string;
    created_at: string;
    mention?: boolean;
}

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
    mentions: Tweet[];
}

interface PendingMemory extends BaseMemory {
    type: 'pending';
    response: string;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: WorkflowToneAnalysis;
        responseStrategy: WorkflowResponseStrategy;
    };
    mentions: Tweet[];
}

interface ApprovedMemory extends BaseMemory {
    type: 'approved';
    response: string;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: WorkflowToneAnalysis;
        responseStrategy: WorkflowResponseStrategy;
    };
    mentions: Tweet[];
}

interface ResponseMemory extends BaseMemory {
    type: 'response';
    response: string;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: WorkflowToneAnalysis;
        responseStrategy: WorkflowResponseStrategy;
    };
    mentions: Tweet[];
}

interface RejectedMemory extends BaseMemory {
    type: 'rejected';
    response: string;
    workflowState: {
        decision: WorkflowDecision;
        toneAnalysis: WorkflowToneAnalysis;
        responseStrategy: WorkflowResponseStrategy;
        autoFeedback?: {
            reason: string;
            suggestedChanges: string;
        };
    };
    mentions: Tweet[];
}

export type AgentMemory = 
    | SkippedMemory 
    | ResponseMemory 
    | RejectedMemory 
    | PendingMemory 
    | ApprovedMemory;

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
    response_status: ResponseStatus | null
    auto_feedback: {
        reason: string;
        suggestedChanges: string;
    } | null;
} 