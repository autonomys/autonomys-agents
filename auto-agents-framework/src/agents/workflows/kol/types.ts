import { TwitterAPI } from '../../../services/twitter/client.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

export type WorkflowConfig = Readonly<{
  twitterAPI: TwitterAPI;
  toolNode: ToolNode;
  llms: Readonly<{
    decision: ChatOpenAI;
    tone: ChatOpenAI;
    response: ChatOpenAI;
  }>;
}>;
