import { Tweet } from './twitter';
import { AgentResponse } from './agent';
import { WorkflowState } from './workflow';

export type QueuedResponse = Readonly<{
    id: string;
    tweet: Tweet;
    response: AgentResponse;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
    workflowState: WorkflowState;
}>;

export type SkippedTweet = Readonly<{
    id: string;
    tweet: Tweet;
    reason: string;
    priority: number;
    createdAt: Date;
    workflowState: WorkflowState;
}>;

export type ApprovalAction = Readonly<{
    id: string;
    approved: boolean;
    feedback?: string;
}>; 