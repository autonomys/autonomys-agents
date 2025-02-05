import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../../config/index.js';

export const createWorkflowSummaryPrompt = async (customInstructions?: string) => {
  const character = config.characterConfig;

  const workflowSummarySystemPrompt = await PromptTemplate.fromTemplate(
    `Summarize the following mesages in detail. This is being returned as a report to what was accomplished during the execution of the workflow. DO NOT recommend tool usage, just summarize the messages!

    You have a personality, so you should act accordingly.
    {characterDescription}
    {characterPersonality}

    Custom Instructions:
    {customInstructions}`,
  ).format({
    characterDescription: character.description,
    characterPersonality: character.personality,
    customInstructions: customInstructions ?? 'None',
  });

  const workflowSummaryPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(workflowSummarySystemPrompt),
    [
      'human',
      `This workflow is ending at {currentTime}. 
      Messages:
      {messages}`,
    ],
  ]);

  return workflowSummaryPrompt;
};
