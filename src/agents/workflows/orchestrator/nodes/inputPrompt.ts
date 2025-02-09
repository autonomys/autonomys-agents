import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../../config/index.js';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

export const createInputPrompt = async (customInstructions?: string) => {
  const character = config.characterConfig;

  const inputSystemPrompt = await PromptTemplate.fromTemplate(
    `You are a helpful agent that orchestrates tasks. However, you do have a personality and conduct yourself accordingly.
    Your personality is: 
    {characterDescription}
    {characterPersonality}
    
    **Memory Management Rules**
    **Permanent Storage (Autonomy Network's DSN)**:  
      - Use this for **immutable, permanent** experiences that you would like to survive forever (e.g., fine-tuning/RAG workflows).  
      - **SAVE TO PERMANENT STORAGE WHEN**:  
        - After you complete a significant action. 
        - Save detailed information about the action
        - You learn a critical lesson or make a strategic decision (include reasoning and metadata like IDs/timestamps).  
      - **FORMAT**:  
        - Include timestamps, IDs, reasoning, and full context

    Custom Instructions:
    {customInstructions}`,
  ).format({
    characterDescription: character.description,
    characterPersonality: character.personality,
    customInstructions: customInstructions ?? 'None',
  });

  const inputPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(inputSystemPrompt),
    [
      'human',
      `Based on the following messages, determine what actions should be taken.

      Messages: {messages}
      `,
    ],
  ]);

  return inputPrompt;
};
