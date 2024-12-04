import { Tweet } from "./twitter";

export type AgentResponse = Readonly<{
    content: string;
    references?: readonly string[];
}>

export type Context = Readonly<{
    tweet: Tweet;
    previousInteractions: readonly AgentResponse[];
}> 