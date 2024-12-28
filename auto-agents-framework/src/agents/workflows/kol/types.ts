import { TwitterApi } from '../../../services/twitter/client.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

export type WorkflowConfig = Readonly<{
  twitterApi: TwitterApi;
  toolNode: ToolNode;
  llms: Readonly<{
    decision: ChatOpenAI;
    tone: ChatOpenAI;
    response: ChatOpenAI;
  }>;
}>;
