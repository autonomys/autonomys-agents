import { Tweet } from './twitter.js';
import { AgentResponse } from './agent.js';
import { WorkflowState } from './workflow.js';

export enum ResponseStatus {
  SKIPPED = 'skipped',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  POSTED = 'posted',
}

export interface PendingResponse {
  id: string;
  tweet_id: string;
  content: string;
  tone: string;
  strategy: string;
  estimatedImpact: number;
  confidence: number;
}

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
  };
}>;

export type QueuedResponseMemory = Readonly<{
  id: string;
  tweet: Tweet;
  response: AgentResponse;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updatedAt: Date;
  workflowState: WorkflowState;
}>;

export type SkippedTweetMemory = Readonly<{
  id: string;
  tweet: Tweet;
  reason: string;
  priority: number;
  created_at: Date;
  workflowState: any;
}>;

export type SkippedTweet = Readonly<{
  id: string;
  tweet_id: string;
  reason: string;
  priority: number;
}>;

export type ApprovalAction = Readonly<{
  id: string;
  approved: boolean;
  feedback?: string;
}>;
