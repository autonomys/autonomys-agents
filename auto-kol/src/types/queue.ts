import { Tweet } from './twitter.js';
import { AgentResponse } from './agent.js';
import { WorkflowState } from './workflow.js';


export type ActionResponse = Readonly<{
    tweet: Tweet;
    status: 'pending' | 'approved' | 'rejected';
    response: {
        id: string;
        content: string;
        tone: string;
        strategy: string;
        estimatedImpact: number;
        confidenceScore: number;
    }
    sendResponseId: string;
}>

export type QueuedResponse = Readonly<{
    id: string;
    tweet: Tweet;
    response: AgentResponse;
    status: 'pending' | 'approved' | 'rejected';
    created_at: Date;
    updatedAt: Date;
    workflowState: WorkflowState;
}>;

export type SkippedTweet = Readonly<{
    id: string;
    tweet: Tweet;
    reason: string;
    priority: number;
    created_at: Date;
    workflowState: WorkflowState;
}>;

export type ApprovalAction = Readonly<{
    id: string;
    approved: boolean;
    feedback?: string;
}>; 