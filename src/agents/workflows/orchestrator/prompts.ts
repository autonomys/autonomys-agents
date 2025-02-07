import { createInputPrompt } from './nodes/inputPrompt.js';
import { createMessageSummaryPrompt } from './nodes/messageSummaryPrompt.js';
import { createFinishWorkflowPrompt } from './nodes/finishWorkflowPrompt.js';
import { OrchestratorPrompts } from './types.js';
export const createPrompts = async (customInstructions?: {
  inputInstructions?: string;
  messageSummaryInstructions?: string;
  finishWorkflowInstructions?: string;
  selfSchedule?: boolean;
}): Promise<OrchestratorPrompts> => {
  const inputPrompt = await createInputPrompt(customInstructions?.inputInstructions);
  const messageSummaryPrompt = await createMessageSummaryPrompt(
    customInstructions?.messageSummaryInstructions,
  );
  const finishWorkflowPrompt = await createFinishWorkflowPrompt(
    customInstructions?.finishWorkflowInstructions,
    customInstructions?.selfSchedule,
  );

  return {
    inputPrompt,
    messageSummaryPrompt,
    finishWorkflowPrompt,
  };
};
