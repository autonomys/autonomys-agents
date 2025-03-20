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
    
    {frequencyPreferences}

    UNIVERSAL WORKFLOW CONTROL RULES:
    
    COMPLETE WORKFLOW (shouldStop = TRUE) WHEN:
    1. You've accomplished your immediate task OR scheduled future tasks for follow-up
    2. You're waiting for anything to complete
    3. You encounter limitations in your current tools
    4. You need to monitor something (schedule it instead)
    5. You need investigation (schedule it instead)
    6. You identify tasks you cannot handle with your current tools
    
    TOOL CAPABILITY ASSESSMENT:
    1. First, examine your "Available Tools" list
    2. Determine what you can actually accomplish with these tools
    3. For tasks beyond your current tools, schedule them for later or for another agent
    
    STOP CONDITIONS (shouldStop = TRUE):
    - Login or technical issues exist
    - Task requires tools not in your "Available Tools" list
    - Monitoring is needed (schedule for later instead)
    - You've done what you can with your available tools
    - You've scheduled appropriate follow-up tasks

    CONTINUE CONDITIONS ( shouldStop = FALSE):
    - You have NEW actions to take right now
    - These actions use tools from your "Available Tools" list
    - These actions can be completed immediately
    - No waiting or monitoring is required

    EXAMPLE DECISIONS:
    1. "Need to respond to Slack messages" but no Slack tools → Schedule +  shouldStop = TRUE
    2. "Need to post tweets" with Twitter posting tools → Do it + shouldStop = FALSE until done
    3. "Need to investigate issue" → Schedule investigation + shouldStop = TRUE
    4. "Waiting for task to complete" → shouldStop = TRUE
    
    {customInstructions}

    {format_instructions}
    `,
  ).format({
    characterGoal: character.goal,
    characterPersonality: character.personality,
    characterExpertise: character.expertise,
    frequencyPreferences: character.frequencyPreferences
      ? `Your frequency preferences are: ${character.frequencyPreferences.join(', ')}`
      : '',
    customInstructions: customInstructions ? `Custom Instructions: ${customInstructions}` : '',
    format_instructions: workflowControlParser.getFormatInstructions(),
  });

  const inputPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(inputSystemPrompt),
    [
      'human',
      `Based on the following messages, executed tools, and available tools, determine what actions should be taken.

      Messages: {messages}
      Available Tools: {availableTools}
      Executed Tools: {executedTools}
      
      DECISION PROCESS:
      1. Examine what tools you actually have available
      2. Check if you face any stopping conditions (login issues, waiting, tool limitations)
      3. Determine if you can complete tasks with your available tools
      4. If you can't complete tasks with available tools, schedule them and set shouldStop = TRUE
      5. If you can complete tasks with available tools and haven't done so yet, set shouldStop = FALSE
      6. After completing all possible tasks with your tools, set shouldStop = TRUE
      `,
    ],
  ]);

  return inputPrompt;
};

const workflowControlSchema = z.object({
  shouldStop: z
    .boolean()
    .describe(
      "Set to TRUE when: (1) you've done everything possible with your available tools, (2) you face tool limitations, (3) you need to wait for anything, or (4) you've scheduled appropriate follow-ups. Set to FALSE ONLY when you have immediate actions to take using your available tools.",
    ),
  reason: z.string().describe('The detailed reason for stopping the workflow.'),
});

export const workflowControlParser = StructuredOutputParser.fromZodSchema(workflowControlSchema);
export type WorkflowControl = z.infer<typeof workflowControlSchema>;
