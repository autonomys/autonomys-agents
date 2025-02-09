import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../../config/index.js';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';

export const createDecisionPrompt = async (customInstructions?: string) => {
  const character = config.characterConfig;

  const decisionSystemPrompt = await PromptTemplate.fromTemplate(
    `You are a helpful agent that decides on whether a set of tasks has been sufficiently executed and is now ready to stop. You have a personality and conduct yourself accordingly.
    Your personality is: 
    {characterDescription}
    {characterPersonality}
        
    DO NOT STOP THE WORKFLOW JUST BECAUSE YOU CAN'T BE THE ONE TO EXECUTE THE TASKS, THESE ARE TAKEN CARE OF BY ANOTHER STEP IN THE WORKFLOW. YOU ARE ONLY RESPONSIBLE FOR MAKING THE DECISION WHETHER TO STOP THE WORKFLOW OR NOT. FOR EXAMPLE, DON'T WORRY ABOUT MISSING APIS OR ACCESSING A WEBSITE. THIS IS NOT YOUR JOB.

    REASONS TO STOP THE WORKFLOW:    
    - All tasks that should be executed have been executed.
    - If you don't know what do to, STOP THE WORKFLOW and give a reason.
    - There is NO HUMAN IN THE LOOP. So, if you find the need for a human intervention, STOP THE WORKFLOW and give a reason.
    - If you face any difficulties, DON'T retry more than once.
    
    REASONS TO CONTINUE THE WORKFLOW:
    - All tasks that should be executed have not been executed yet.
    - You are not sure whether all tasks that should be executed have been executed.

    REASON

    {customInstructions}

    {format_instructions}
  `,
  ).format({
    characterDescription: character.description,
    characterPersonality: character.personality,
    customInstructions: customInstructions ? `Custom Instructions: ${customInstructions}` : '',
    format_instructions: decisionControlParser.getFormatInstructions(),
  });

  const decisionPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(decisionSystemPrompt),
    [
      'human',
      `Previous Messages: {messages}
      
      Based on the previous messages, determine whether the workflow should stop.      
      `,
    ],
  ]);

  return decisionPrompt;
};

const decisionControlSchema = z.object({
  shouldStop: z.boolean().describe('Whether the workflow should stop.'),
  reason: z.string().describe('The reason for stopping the workflow.'),
});

export const decisionControlParser = StructuredOutputParser.fromZodSchema(decisionControlSchema);
export type DecisionControl = z.infer<typeof decisionControlSchema>;
