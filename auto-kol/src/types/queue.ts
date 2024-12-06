import { Tweet } from './twitter.js';
import { AgentResponse } from './agent.js';
import { WorkflowState } from './workflow.js';

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
    tweetId: string;
    responseId: string;
    approved: boolean;
    feedback?: string;
}>; 