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
    - Include a "schedule" object with the following fields:
      - nextWorkflowPrompt: A recommendation for the next prompt for when the workflow begins again
      - secondsUntilNextWorkflow: A recommendation for how long until the next workflow should begin
    - {frequencyPreference}

    If self-schedule:false 
    - COMPLETELY OMIT the schedule field from your JSON response
    - Your JSON should only contain the summary field when self-schedule is false

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

const scheduleSchema = z.object({
  nextWorkflowPrompt: z
    .string()
    .describe(
      'The input prompt for the next workflow. Be thoughtful about what you want to accomplish in the next workflow and write this as a prompt. It should be inline with the goals and expertise of the character and potentially different from the previous workflow.',
    ),
  secondsUntilNextWorkflow: z
    .number()
    .describe('The recommended number of seconds until the workflow should begin again.'),
});

// Define the finished workflow schema with an optional schedule
const finishedWorkflowSchema = z.object({
  summary: z.string().describe('A detailed summary of the actions performed.'),
  schedule: scheduleSchema
    .optional()
    .describe(
      'If self-scheduling is enabled, this object contains scheduling information for the next workflow.',
    ),
});

export const finishedWorkflowParser = StructuredOutputParser.fromZodSchema(finishedWorkflowSchema);
export type Schedule = z.infer<typeof scheduleSchema>;
export type FinishedWorkflow = z.infer<typeof finishedWorkflowSchema>;
