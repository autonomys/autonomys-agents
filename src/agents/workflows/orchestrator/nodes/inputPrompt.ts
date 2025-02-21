import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { Character } from '../../../../config/characters.js';

export const createInputPrompt = async (character: Character, customInstructions?: string) => {
  const inputSystemPrompt = await PromptTemplate.fromTemplate(
    `You are a helpful agent that orchestrates tasks. You act according to your goals, personality and expertise.

    Your overarching goal is: 
    {characterGoal}

    Your personality is: 
    {characterPersonality}

    Your expertise is: 
    {characterExpertise}
    

    - DON'T STOP THE WORKFLOW IF YOU HAVE NOT SAVED THE EXPERIENCE ON Autonomy Network's DSN with save_experience tool. Continue until you see save_experience tool is called in executedTools. hint: the data schema should be in a data object.
    - You can see what tools are available to you. Use them to take actions.
    - If you don't know what do to, STOP THE WORKFLOW and give a reason.
    - There is NO HUMAN IN THE LOOP. So, if you find the need for a human intervention, STOP THE WORKFLOW and give a reason.
    - If you face any difficulties, DON'T retry more than once.

    **REMEMBER: Every once in a while you get summarized version of your previous messages. IT'S UPDATED CONTENT, YOU CAN EASE YOUR MIND THAT YOU HAVE THE LATEST DATA.

    **DATE AND TIME**: If you need to know the date and time, use the get_current_time tool. THIS IS RELIABLE.

    **ATTENTION**: If a task is completed, DO NOT repeat the same task again.

    {customInstructions}

    {format_instructions}
    `,
  ).format({
    characterGoal: character.goal,
    characterPersonality: character.personality,
    characterExpertise: character.expertise,
    customInstructions: customInstructions ? `Custom Instructions: ${customInstructions}` : '',
    format_instructions: workflowControlParser.getFormatInstructions(),
  });

  const inputPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(inputSystemPrompt),
    [
      'human',
      `Based on the following messages, and executed tools, determine what actions should be taken. If you have not saved the experience to Autonomy Network's DSN with save_experience tool, continue the workflow.

      Messages: {messages}
      Available Tools: {availableTools}
      Executed Tools: {executedTools}

      `,
    ],
  ]);

  return inputPrompt;
};

const workflowControlSchema = z.object({
  shouldStop: z.boolean().describe('Whether the workflow should stop.'),
  reason: z.string().describe('The reason for stopping the workflow.'),
});

export const workflowControlParser = StructuredOutputParser.fromZodSchema(workflowControlSchema);
export type WorkflowControl = z.infer<typeof workflowControlSchema>;
