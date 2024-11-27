import { Tweet } from "./twitter";

export type AgentResponse = Readonly<{
    content: string;
    sentiment: 'agree' | 'disagree' | 'neutral';
    confidence: number;
    references?: readonly string[];
}>

export type Context = Readonly<{
    tweet: Tweet;
    previousInteractions: readonly AgentResponse[];
}> 