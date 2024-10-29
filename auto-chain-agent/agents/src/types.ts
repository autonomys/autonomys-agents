import { BaseMessage } from '@langchain/core/messages';

export interface ThreadState {
    state: {
        messages: BaseMessage[];
        toolCalls: Array<{
            name: string;
            args: Record<string, any>;
            id: string;
            type: string;
        }>;
    };
    lastOutput?: {
        response: string;
        toolCalls: Array<{
            name: string;
            args: Record<string, any>;
            id: string;
            type: string;
        }>;
    };
}
