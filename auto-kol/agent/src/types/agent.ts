import { Tweet } from './twitter.js';

export type AgentResponse = Readonly<{
  content: string;
  references?: readonly string[];
}>;

export type Context = Readonly<{
  tweet: Tweet;
  previousInteractions: readonly AgentResponse[];
}>;
