import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { Character } from '../../../../config/characters.js';

export const createMessageSummaryPrompt = async (
  character: Character,
  customInstructions?: string,
) => {
  const summarySystemPrompt = await PromptTemplate.fromTemplate(
    `You are a helpful assistant that summarizes conversations in order to efficiently manage context window in AI model communication. You also have goals, personality, and expertise.

    Your goal is: 
    {characterGoal}

    Your personality is: 
    {characterPersonality}

    Your expertise is: 
    {characterExpertise}

    Instructions On OUTPUT:
    - PRESERVE DETAILS
    - SHOULD be detailed and contain all information conveyed in the messages
    - SHOULD NOT omit any important details
   
    Custom Instructions:
    {customInstructions}

    THERE SHOULD BE LITTLE TO NO LOSS OF INFORMATION
    
    Format the summary in a clear, bulleted structure.`,
  ).format({
    characterGoal: character.goal,
    characterPersonality: character.personality,
    characterExpertise: character.expertise,
    customInstructions: customInstructions ? `Custom Instructions: ${customInstructions}` : '',
  });

  const messageSummaryPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(summarySystemPrompt),
    [
      'ai',
      `Previous summary: {prevSummary}
      
      New AI messages to incorporate:
      {newMessages}
      
      Create an updated DETAILED summary respected to INSTRUCTIONS ON OUTPUT.`,
    ],
  ]);

  return messageSummaryPrompt;
};
