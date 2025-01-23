import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../config/index.js';
import { z } from 'zod';

// Define schema for workflow control

export const createPrompts = async () => {
  const character = config.characterConfig;

  const inputSystemPrompt = await PromptTemplate.fromTemplate(
    `You are a helpful assistant helping orchestrate tasks.
    Your personality is: 
    {characterDescription}
    {characterPersonality}
    
    After you completed the task(s), STOP THE WORKFLOW following the given JSON format.
    If you face any difficulties, DON'T retry more than once.
    `,

    
  ).format({
    characterDescription: character.description,
    characterPersonality: character.personality,
  });

  const inputPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(inputSystemPrompt),
    [
      'human',
      `Based on the following messages, determine what should be done next or just answer to the best of your ability.
      Format your response as a JSON object with shouldStop (boolean) and reason (string).

      Messages: {messages}
      `,
    ],
  ]);

  return { inputPrompt };
};

export const workflowControlParser = z.object({
  shouldStop: z.boolean(),
  reason: z.string(),
});

export type WorkflowControl = z.infer<typeof workflowControlParser>;
