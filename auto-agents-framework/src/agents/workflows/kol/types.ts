import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { z } from 'zod';
import { Tweet, TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOllama } from '@langchain/ollama';
import { Runnable } from '@langchain/core/runnables';
import { engagementSchema, responseSchema, skippedEngagementSchema, dsnTweet } from './schemas.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export enum DsnDataType {
  RESPONSE = 'response',
  SKIPPED_ENGAGEMENT = 'skipped',
  GENERATED_TWEET = 'posted',
}
export type WorkflowConfig = Readonly<{
  twitterApi: TwitterApi;
  toolNode: ToolNode;
  llms: Readonly<{
    decision: ChatOpenAI | ChatAnthropic | ChatOllama;
    analyze: ChatOpenAI | ChatAnthropic | ChatOllama;
    generation: ChatOpenAI | ChatAnthropic | ChatOllama;
    response: ChatOpenAI | ChatAnthropic | ChatOllama;
  }>;
  prompts: Readonly<{
    engagementPrompt: ChatPromptTemplate;
    trendPrompt: ChatPromptTemplate;
    tweetPrompt: ChatPromptTemplate;
    responsePrompt: ChatPromptTemplate;
    summaryPrompt: ChatPromptTemplate;
  }>;
}>;

export type EngagementDecision = {
  decision: z.infer<typeof engagementSchema>;
  tweet: Tweet;
};

export type DsnResponseData = {
  type: DsnDataType.RESPONSE;
  tweet: z.infer<typeof dsnTweet>;
  decision: z.infer<typeof engagementSchema>;
} & z.infer<typeof responseSchema>;

export type DsnSkippedEngagementData = {
  type: DsnDataType.SKIPPED_ENGAGEMENT;
  tweet: z.infer<typeof dsnTweet>;
} & z.infer<typeof skippedEngagementSchema>;

export type DsnGeneratedTweetData = {
  type: DsnDataType.GENERATED_TWEET;
  content: string;
  tweetId: string | null;
};

export type DsnData = DsnResponseData | DsnSkippedEngagementData | DsnGeneratedTweetData;
