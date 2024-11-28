import { Tweet } from './twitter';
import { BaseMessage } from '@langchain/core/messages';

export type EngagementDecision = Readonly<{
    shouldEngage: boolean;
    reason: string;
    priority: number;  // 1-10 scale
}>;

export type ToneAnalysis = Readonly<{
    dominantTone: string;
    suggestedTone: string;
    reasoning: string;
}>;

export type ResponseAlternative = Readonly<{
    content: string;
    tone: string;
    strategy: string;
    estimatedImpact: number;  // 1-10 scale
}>;

export type ResponseSelection = Readonly<{
    selectedResponse: string;
    reasoning: string;
    confidence: number;
}>;

// State management for the workflow
export type WorkflowState = Readonly<{
    tweet: Tweet;
    messages: BaseMessage[];
    engagementDecision?: EngagementDecision;
    toneAnalysis?: ToneAnalysis;
    alternatives?: ResponseAlternative[];
    selectedResponse?: ResponseSelection;
    previousInteractions: readonly string[];
}>; 