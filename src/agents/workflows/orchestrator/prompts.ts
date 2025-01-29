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
    
    TASK COMPLETION RULES:
    
    1. When you see "STATUS: COMPLETED" in a message:
     - This means the task has already been executed
     - DO NOT attempt to repeat completed tasks
     - Look for the next pending task or stop workflow
  
    2. When you see "STATUS: PENDING":
     - Only proceed if there are no COMPLETED versions of the same task
     - Check all messages for completion status before starting

    3. Task Completion Detection:
     - Compare task descriptions between COMPLETED and PENDING
     - If a COMPLETED task matches a PENDING task's description, treat as done
     - Pay special attention to matching parameters (e.g., tweet counts, criteria)

    - You get a summarized version of the previous task(s).
    - You are using a similarity search over the previous interactions. It is possible to see COMPLETED task and PENDING. It's likely the task is completed if you see "COMPLETED". In this case, look for the next action.
    - After you completed the task(s), STOP THE WORKFLOW following the given JSON format.
    - If you don't know what do to, STOP THE WORKFLOW and give a reason.
    - There is NO HUMAN IN THE LOOP. So, NEVER THINK YOU NEED A HUMAN ASSISTANCE! otherwise there is a system bug.
    - If you face any difficulties, DON'T retry more than once.
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
