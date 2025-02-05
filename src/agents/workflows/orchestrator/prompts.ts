import { createInputPrompt } from './nodes/inputPrompt.js';
import { createMessageSummaryPrompt } from './nodes/messageSummaryPrompt.js';
import { createWorkflowSummaryPrompt } from './nodes/workflowSummaryPrompt.js';
import { OrchestratorPrompts } from './types.js';
export const createPrompts = async (customInstructions?: {
  inputInstructions?: string;
  messageSummaryInstructions?: string;
  workflowSummaryInstructions?: string;
}): Promise<OrchestratorPrompts> => {
  const inputPrompt = await createInputPrompt(customInstructions?.inputInstructions);
  const messageSummaryPrompt = await createMessageSummaryPrompt(
    customInstructions?.messageSummaryInstructions,
  );
  const workflowSummaryPrompt = await createWorkflowSummaryPrompt(
    customInstructions?.workflowSummaryInstructions,
  );

  return {
    inputPrompt,
    messageSummaryPrompt,
    workflowSummaryPrompt,
  };
};
