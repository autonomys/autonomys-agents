import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
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
    
    YOU SHOULD CONTROL THE WORKFLOW WITH THE STOP WORKFLOW TOOL, stop_workflow

    COMPLETE WORKFLOW WHEN:
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
    
    STOP CONDITIONS:
    - Login or technical issues exist
    - Task requires tools not in your "Available Tools" list
    - Monitoring is needed (schedule for later instead)
    - You've done what you can with your available tools
    - You've scheduled appropriate follow-up tasks

    CONTINUE CONDITIONS:
    - You have NEW actions to take right now
    - These actions use tools from your "Available Tools" list
    - These actions can be completed immediately
    - No waiting or monitoring is required

    EXAMPLE DECISIONS:
    1. "Need to respond to Slack messages" but no Slack tools → Schedule +  stop_workflow
    2. "Need to post tweets" with Twitter posting tools → Do it + stop_workflow = FALSE until done
    3. "Need to investigate issue" → Schedule investigation + stop_workflow
    4. "Waiting for task to complete" → stop_workflow
    
    {customInstructions}

    `,
  ).format({
    characterGoal: character.goal,
    characterPersonality: character.personality,
    characterExpertise: character.expertise,
    frequencyPreferences: character.frequencyPreferences
      ? `Your frequency preferences are: ${character.frequencyPreferences.join(', ')}`
      : '',
    customInstructions: customInstructions ? `Custom Instructions: ${customInstructions}` : '',
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
      4. If you can't complete tasks with available tools, schedule them and use the stop_workflow tool to stop the workflow
      5. If you can complete tasks with available tools and haven't done so yet.
      6. After completing all possible tasks with your tools, use the stop_workflow tool to stop the workflow
      7. If you find yourself in a loop (repeatedly doing the same thing), use the stop_workflow tool to stop the workflow
      `,
    ],
  ]);

  return inputPrompt;
};