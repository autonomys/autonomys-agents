import { BaseMessage, MessageContent } from '@langchain/core/messages';

export interface ThreadState {
    messages: BaseMessage[];
    toolCalls: Array<{
        id: string;
        type: string;
        function: {
            name: string;
            arguments: string;
        };
        result?: string;
    }>;
}
export interface ConversationState {
    isInitialLoad: boolean;
    needsHistoryRebuild: boolean;
}

export interface SummaryDifference {
    timestamp: string;
    threadId: string;
    previousSummary: string | MessageContent;
    currentSummary: string | MessageContent;
    difference: string | MessageContent;
    previousCID?: string;
}

export interface SummaryState {
    lastCheck: string;
    differences: SummaryDifference[];
}

