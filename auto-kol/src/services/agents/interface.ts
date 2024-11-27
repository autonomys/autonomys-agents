export interface Tweet {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
}

export interface AgentResponse {
    content: string;
    sentiment: 'agree' | 'disagree' | 'neutral';
    confidence: number;
    references?: string[];
}

export interface Agent {
    handleTweet(tweet: Tweet): Promise<AgentResponse>;
    generateResponse(context: string): Promise<string>;
} 