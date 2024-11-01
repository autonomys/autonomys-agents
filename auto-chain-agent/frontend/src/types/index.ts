export interface Message {
    role: 'user' | 'assistant' | 'error';
    content: string;
    timestamp: Date;
    toolCalls?: Array<{
        id: string;
        type: string;
        function: {
            name: string;
            arguments: string;
        };
        result?: string;
    }>;
} 