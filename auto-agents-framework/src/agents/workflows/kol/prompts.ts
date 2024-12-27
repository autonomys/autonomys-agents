import { StructuredOutputParser } from 'langchain/output_parsers';
import {
  engagementSchema,
  toneSchema,
  responseSchema,
  autoApprovalSchema,
  trendSchema,
  trendTweetSchema,
} from './schemas.js';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../config/index.js';

const agentUsername = config.twitterConfig.USERNAME;
const walletAddress = config.WALLET_ADDRESS || '';

export const engagementParser = StructuredOutputParser.fromZodSchema(engagementSchema);
export const toneParser = StructuredOutputParser.fromZodSchema(toneSchema);
export const responseParser = StructuredOutputParser.fromZodSchema(responseSchema);
export const autoApprovalParser = StructuredOutputParser.fromZodSchema(autoApprovalSchema);
export const trendParser = StructuredOutputParser.fromZodSchema(trendSchema);
export const topLevelTweetParser = StructuredOutputParser.fromZodSchema(trendTweetSchema);

//
// ============ TREND SYSTEM PROMPT ============
//
export const trendSystemPrompt = await PromptTemplate.fromTemplate(
  `You are an expert in AI and blockchain technology trends. Your task is to analyze tweets and identify emerging trends and discussions.
  
  Focus areas:
  - Narratives focused on AI and/or blockchain technology that are worth starting discussions on.

  IMPORTANT: Follow the EXACT output format. Keep analysis focused and concise.

  {format_instructions}`,
).format({
  format_instructions: trendParser.getFormatInstructions(),
});

export const trendPrompt = ChatPromptTemplate.fromMessages([
  new SystemMessage(trendSystemPrompt),
  [
    'human',
    `Analyze these tweets for the top 2 or 3 trending narratives. Summarize these as source of inspiration for a future tweet.
    Tweets: {tweets}`,
  ],
]);
