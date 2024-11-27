import { Tweet } from './twitter';
import { AgentResponse } from './agent';

export type QueuedResponse = Readonly<{
    id: string;
    tweet: Tweet;
    response: AgentResponse;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}>;

export type ApprovalAction = Readonly<{
    id: string;
    approved: boolean;
    feedback?: string;
}>; 