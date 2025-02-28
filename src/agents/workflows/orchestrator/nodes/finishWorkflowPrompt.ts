import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { Character } from '../../../../config/characters.js';

export const createFinishWorkflowPrompt = async (
  character: Character,
  customInstructions?: string,
  selfSchedule?: boolean,
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
    
    self-schedule:{selfSchedule} 
    If self-schedule:true 
    - Provide a recommendation for the next prompt for when the workflow begins again in the nextWorkflowPrompt field.
    - Provide a recommendation for how long until the next workflow should begin in the secondsUntilNextWorkflow field.
    - {frequencyPreference}

    If self-schedule:false 
    - Do not include any values in the nextWorkflowPrompt or secondsUntilNextWorkflow fields. DO NOT RETURN ANYTHING IN THESE FIELDS, INCLUDING NULL

    You have a personality, so you should act accordingly. 
    {characterPersonality} 

    {customInstructions}
    
    {followFormatInstructions}
    Format Instructions:
    {formatInstructions}`,
  ).format({
    characterPersonality: character.personality,
    customInstructions: customInstructions ? `Custom Instructions: ${customInstructions}` : '',
    formatInstructions: finishedWorkflowParser.getFormatInstructions(),
    followFormatInstructions,
    selfSchedule: selfSchedule ? 'true' : 'false',
    frequencyPreference:
      selfSchedule && character.frequencyPreferences
        ? character.frequencyPreferences.join(', ')
        : '',
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

const finishedWorkflowSchema = z.object({
  summary: z.string().describe('A detailed summary of the actions performed.'),
  nextWorkflowPrompt: z
    .string()
    .optional()
    .describe(
      'If self-scheduling is enabled, this field will be the input prompt for the next workflow. Be thoughtful about what you want to accomplish in the next workflow and write this as a prompt.',
    ),
  secondsUntilNextWorkflow: z
    .number()
    .optional()
    .describe(
      'If self-scheduling is enabled, this field will be the recommended number of seconds until the workflow should begin again.',
    ),
});

export const finishedWorkflowParser = StructuredOutputParser.fromZodSchema(finishedWorkflowSchema);
export type FinishedWorkflow = z.infer<typeof finishedWorkflowSchema>;
