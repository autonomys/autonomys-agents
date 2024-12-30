import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { z } from 'zod';
import { Tweet, TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Runnable } from '@langchain/core/runnables';
import { engagementSchema } from './schemas.js';

export type WorkflowConfig = Readonly<{
  twitterApi: TwitterApi;
  toolNode: ToolNode;
  llms: Readonly<{
    decision: ChatOpenAI;
    analyze: ChatOpenAI;
    generation: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAI>;
    response: Runnable<BaseLanguageModelInput, AIMessageChunk, ChatOpenAI>;
  }>;
}>;

export type EngagementDecision = {
  decision: z.infer<typeof engagementSchema>;
  tweet: Tweet;
};
