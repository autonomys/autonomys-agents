import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { Character } from '../../../../config/types.js';

export const createFinishWorkflowPrompt = async (
  character: Character,
  customInstructions?: string,
) => {
  const followFormatInstructions = `
  IMPORTANT:
  - Return ONLY the raw JSON data
  - DO NOT include any markdown formatting, code blocks, or backticks
  - DO NOT wrap response in code block markers
  - Do not include any additional text or explanations
  - The response should NOT start with \`\`\`json and end with \`\`\`
  - The response should start and end with curly braces`;

  const workflowSummarySystemPrompt = await PromptTemplate.fromTemplate(
    `
    Summarize the following messages in detail. This is being returned as a report to what was accomplished during the execution of the workflow.
    
    You have a personality, goals and expertise, so you should act accordingly. 
    Personality: {characterPersonality} 
    Goals: {characterGoals}
    Expertise: {characterExpertise}

    {customInstructions}
    
    {followFormatInstructions}
    Format Instructions:
    {formatInstructions}`,
  ).format({
    characterPersonality: character.personality,
    characterGoals: character.goal,
    characterExpertise: character.expertise,
    customInstructions: customInstructions ? `Custom Instructions: ${customInstructions}` : '',
    formatInstructions: finishedWorkflowParser.getFormatInstructions(),
    followFormatInstructions,
  });

  const workflowSummaryPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(workflowSummarySystemPrompt),
    [
      'human',
      `This workflow is ending at {currentTime}. 
      Summarize these messages:
      {messages}`,
    ],
  ]);

  return workflowSummaryPrompt;
};

// Define the finished workflow schema
const finishedWorkflowSchema = z.object({
  summary: z.string().describe('A detailed summary of the actions performed.'),
});

export const finishedWorkflowParser = StructuredOutputParser.fromZodSchema(finishedWorkflowSchema);
export type FinishedWorkflow = z.infer<typeof finishedWorkflowSchema>;
