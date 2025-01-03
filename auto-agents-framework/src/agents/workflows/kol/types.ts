import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { z } from 'zod';
import { Tweet, TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Runnable } from '@langchain/core/runnables';
import { engagementSchema, responseSchema, DSNTweet, skippedEngagementSchema } from './schemas.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';

export type WorkflowConfig = Readonly<{
  twitterApi: TwitterApi;
  toolNode: ToolNode;
  llms: Readonly<{
    decision: ChatOpenAI;
    analyze: ChatOpenAI;
    generation: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAI>;
    response: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAI>;
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

export enum dsnDataType {
  RESPONSE = 'response',
  SKIPPED_ENGAGEMENT = 'skipped_engagement',
  GENERATED_TWEET = 'generated_tweet',
}

export type dsnResponseData = {
  type: dsnDataType.RESPONSE;
  tweet: z.infer<typeof DSNTweet>;
  decision: z.infer<typeof engagementSchema>;
} & z.infer<typeof responseSchema>;

export type dsnSkippedEngagementData = {
  type: dsnDataType.SKIPPED_ENGAGEMENT;
  tweet: z.infer<typeof DSNTweet>;
} & z.infer<typeof skippedEngagementSchema>;

export type dsnGeneratedTweetData = {
  type: dsnDataType.GENERATED_TWEET;
  content: string;
  tweetId: string | null;
};

export type dsnData = dsnResponseData | dsnSkippedEngagementData | dsnGeneratedTweetData;
