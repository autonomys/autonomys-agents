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
import { character } from './characters/character.js';

export const engagementParser = StructuredOutputParser.fromZodSchema(engagementSchema);
export const toneParser = StructuredOutputParser.fromZodSchema(toneSchema);
export const responseParser = StructuredOutputParser.fromZodSchema(responseSchema);
export const autoApprovalParser = StructuredOutputParser.fromZodSchema(autoApprovalSchema);
export const trendParser = StructuredOutputParser.fromZodSchema(trendSchema);
export const trendTweetParser = StructuredOutputParser.fromZodSchema(trendTweetSchema);

//
// ============ TREND PROMPTS ============
//

const followFormatInstructions = `
  IMPORTANT:
  - Return ONLY the raw JSON data
  - DO NOT include any markdown formatting, code blocks, or backticks
  - DO NOT wrap response in code block markers
  - Do not include any additional text or explanations
  - The response should NOT start with \`\`\`json and end with \`\`\`
  - The response should start and end with curly braces
`;

const trendSystemPrompt = await PromptTemplate.fromTemplate(
  `You are an expert in:
  ${character.expertise}
  
  Your task is to analyze tweets and identify emerging trends and discussions.
  
  Focus areas:
  ${character.trendFocus}

  ${followFormatInstructions}

  {format_instructions}`,
).format({
  format_instructions: trendParser.getFormatInstructions(),
});

export const trendPrompt = ChatPromptTemplate.fromMessages([
  new SystemMessage(trendSystemPrompt),
  [
    'human',
    `Tweets: {tweets}
    Analyze these tweets for the top 2 trending narratives. 
    Give a 2-3 paragraph, detailed summary of these as source of inspiration for a future tweet.
    `,
  ],
]);

//
// ============ TWEET PROMPTS ============
//
export const tweetSystemPrompt = await PromptTemplate.fromTemplate(
  `You are an expert in:
  ${character.expertise}
  
  Your task is to craft tweets in response to trending topics.
  
  Focus areas:
  ${character.trendFocus}

  Personality & Style:
  ${character.description}
  ${character.personality}
  ${character.rules}
  ${character.contentFocus}

  Do not use these words:
  ${character.wordsToAvoid}

  ${followFormatInstructions}

  {format_instructions}`,
).format({
  format_instructions: trendTweetParser.getFormatInstructions(),
});

export const tweetPrompt = ChatPromptTemplate.fromMessages([
  new SystemMessage(tweetSystemPrompt),
  [
    'human',
    `Trend analysis: {trendAnalysis}
    Craft an entertaining and engaging tweet in response to this trend. 
    The tweet should be well thought out and thought provoking.
    Use your personality and style to make the tweet more engaging.

    IMPORTANT:
    Recent tweets: {recentTweets}
    - Avoid sounding repetitive and touching on the same topics.
    - DO NOT use similar opening phrases as your recent tweets.
    - Stay in character but mix up your language and style.
    `,
  ],
]);
