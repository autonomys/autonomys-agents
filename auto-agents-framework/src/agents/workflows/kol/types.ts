import { BaseLanguageModelInput } from '@langchain/core/language_models/base';
import { AIMessageChunk } from '@langchain/core/messages';
import { TwitterApi } from '../../../services/twitter/types.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { Runnable } from '@langchain/core/runnables';

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
