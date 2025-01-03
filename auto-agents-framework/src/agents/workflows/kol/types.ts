import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { z } from 'zod';
import { Tweet, TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Runnable } from '@langchain/core/runnables';
import { engagementSchema, responseSchema } from './schemas.js';
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

export type DSNResponseData = {
  type: 'response';
  decision: z.infer<typeof engagementSchema>;
} & z.infer<typeof responseSchema>;

export type DsnSkippedEngagementData = {
  type: 'skipped_engagement';
  decision: z.infer<typeof engagementSchema>;
  tweet: {
    id: string;
    text: string;
    username: string;
    thread?: {
      id: string;
      text: string;
      username: string;
    }[];
  };
};

export type DsnGeneratedTweetData = {
  type: 'generated_tweet';
  content: string;
  tweetId: string | null;
};

export type DsnData = DSNResponseData | DsnSkippedEngagementData | DsnGeneratedTweetData;
