import { StructuredOutputParser } from 'langchain/output_parsers';
import {
  engagementSchema,
  responseSchema,
  summarySchema,
  trendSchema,
  trendTweetSchema,
} from './schemas.js';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../config/index.js';
import { wallet } from '../../tools/utils/blockchain/agentWallet.js';

const followFormatInstructions = `
  IMPORTANT:
  - Return ONLY the raw JSON data
  - DO NOT include any markdown formatting, code blocks, or backticks
  - DO NOT wrap response in code block markers
  - Do not include any additional text or explanations
  - The response should NOT start with \`\`\`json and end with \`\`\`
  - The response should start and end with curly braces
`;

export const engagementParser = StructuredOutputParser.fromZodSchema(engagementSchema);
export const responseParser = StructuredOutputParser.fromZodSchema(responseSchema);
export const trendParser = StructuredOutputParser.fromZodSchema(trendSchema);
export const trendTweetParser = StructuredOutputParser.fromZodSchema(trendTweetSchema);
export const summaryParser = StructuredOutputParser.fromZodSchema(summarySchema);

export const createPrompts = async () => {
  const character = config.characterConfig;
  const { communicationRules, twitterProfile } = character;

  const engagementSystemPrompt = await PromptTemplate.fromTemplate(
    `Your task is to evaluate tweets and decide whether they warrant a response.

    Personality & Style:
    ${character.description}
    ${character.personality}
    ${twitterProfile.replyStyle}

    Criteria for engagement:
    ${twitterProfile.engagementCriteria}

    If the tweet is irrelevant or not engaging, or if you lack context, respond with shouldEngage: false.
    If the tweet references you (@${twitterProfile.username}):
      - You may respond even if relevance is low if there's entertainment value.
      - judge whether the author is wanting to continue engagement, if not you should not engage.
      - if there is a thread, review it to determine whether there is value in continuing the conversation.

    If the tweet has a link, ignore the link. We only care about the tweet text.
    If there's insufficient content for a proper assessment, return shouldEngage: false.

    ${followFormatInstructions}

    {format_instructions}`,
  ).format({
    format_instructions: engagementParser.getFormatInstructions(),
  });

  const engagementPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(engagementSystemPrompt),
    [
      'human',
      `Evaluate this tweet and provide your structured decision:
          Tweet: {tweet}
          Thread context (most recent tweets first): 
          {thread}

          If there is no thread context, evaluate the tweet on its own.
          If there is a thread, review the thread to determine whether there is value in continuing the conversation. 
          If the thread is repetitive or getting excessively long, reject further engagement. 
          As the thread gets longer, the value of the conversation decreases exponentially.`,
    ],
  ]);

  const trendSystemPrompt = await PromptTemplate.fromTemplate(
    `You are an expert in:
    ${character.expertise}
    
    Your task is to analyze tweets and identify emerging trends and discussions.
    
    Focus areas:
    ${twitterProfile.trendFocus}

    ${followFormatInstructions}

    {format_instructions}`,
  ).format({
    format_instructions: trendParser.getFormatInstructions(),
  });

  const trendPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(trendSystemPrompt),
    [
      'human',
      `Tweets: {tweets}
      Analyze these tweets for the top trending narrative.
      Give a 2-3 paragraph, detailed summary to be used as the source of inspiration for a future tweet.
      `,
    ],
  ]);

  const tweetSystemPrompt = await PromptTemplate.fromTemplate(
    `You are an expert in:
    ${character.expertise}
    
    Your task is to craft tweets in response to trending topics.
    
    Focus areas:
    ${twitterProfile.trendFocus}

    Personality & Style:
    ${character.description}
    ${character.personality}
    ${communicationRules.rules}
    ${twitterProfile.contentFocus}

    Do not use these words:
    ${communicationRules.wordsToAvoid}

    ${followFormatInstructions}

    {format_instructions}`,
  ).format({
    format_instructions: trendTweetParser.getFormatInstructions(),
  });

  const tweetPrompt = ChatPromptTemplate.fromMessages([
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

  const responseSystemPrompt = await PromptTemplate.fromTemplate(
    `You are an expert in:
    ${character.expertise}
    
    Your task is to respond to tweets and engage with the author. 

    General Info:
    ${character.name}
    ${twitterProfile.username}
    ${wallet.address}

    Personality & Style:
    ${character.description}
    ${character.personality}
    ${communicationRules.rules}
    ${twitterProfile.replyStyle}
    ${twitterProfile.contentFocus}

    Do not use these words:
    ${communicationRules.wordsToAvoid}

    ${followFormatInstructions}
    {format_instructions}`,
  ).format({
    format_instructions: responseParser.getFormatInstructions(),
  });

  const responsePrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(responseSystemPrompt),
    [
      'human',
      `A decision has been made to engage with this tweet. Respond and engage with the author. 
      Decision: {decision}
      Thread context (most recent tweets first): 
      {thread}
  
      If there a thread, respond accurately. Review the thread with a focus on the most recent tweets and respond accordingly
    
      CRITICAL PATTERN ANALYSIS - YOU MUST AVOID THESE PATTERNS:
      1. DO NOT use these detected patterns in your response:
      {patterns}
  
      2. BANNED PHRASES - DO NOT USE:
      {commonWords}    
      `,
    ],
  ]);

  const summarySystemPrompt = await PromptTemplate.fromTemplate(
    `You are an analytics expert focusing on identifying specific patterns in tech commentary.
    
    Your task is to analyze tweets and describe their pattern at a conceptual level.
    Do NOT list specific examples. Instead, explain:
  
    1. The abstract structural pattern of responses:
      - How sentences are constructed
      - What format they follow
      - How ideas are connected
  
    2. The linguistic devices used:
      - Common opening phrases
      - Transition words
      - How references are incorporated
  
    ${followFormatInstructions}
  
    {format_instructions}`,
  ).format({
    format_instructions: summaryParser.getFormatInstructions(),
  });

  const summaryPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(summarySystemPrompt),
    [
      'human',
      `Review these tweets texts and provide a detailed analysis:
      Tweets: {tweets}
      
      This analysis will be used to improve response variety`,
    ],
  ]);
  return {
    engagementPrompt,
    trendPrompt,
    tweetPrompt,
    responsePrompt,
    summaryPrompt,
  };
};
