import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { config } from '../../../../config/index.js';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';

export const createFinishWorkflowPrompt = async (customInstructions?: string) => {
  const character = config.characterConfig;

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
    Additionally,provide a recommendation for the next action to take when the workflow begins again and how long until the next workflow should begin.

    You have a personality, so you should act accordingly.
    {characterDescription}
    {characterPersonality}

    Custom Instructions:
    {customInstructions}
    
    {followFormatInstructions}
    Format Instructions:
    {formatInstructions}`,
  ).format({
    characterDescription: character.description,
    characterPersonality: character.personality,
    customInstructions: customInstructions ?? 'None',
    formatInstructions: finishedWorkflowParser.getFormatInstructions(),
    followFormatInstructions,
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

const finishedWorkflowSchema = z.object({
  workflowSummary: z.string().describe('A summary of the workflow.'),
  nextRecommendedAction: z
    .string()
    .optional()
    .describe(
      'Given what was accomplished during the workflow and our overall goal,the next recommended action when the workflow begins again',
    ),
  secondsUntilNextWorkflow: z
    .number()
    .optional()
    .describe(
      'Given what was accomplished during the workflow and our overall goal, the recommended number of seconds until the workflow should begin again.',
    ),
});

export const finishedWorkflowParser = StructuredOutputParser.fromZodSchema(finishedWorkflowSchema);
export type FinishedWorkflow = z.infer<typeof finishedWorkflowSchema>;
