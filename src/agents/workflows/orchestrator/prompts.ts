import { createInputPrompt } from './nodes/inputPrompt.js';
import { createMessageSummaryPrompt } from './nodes/messageSummaryPrompt.js';
import { createFinishWorkflowPrompt } from './nodes/finishWorkflowPrompt.js';
import { createDecisionPrompt } from './nodes/decisionPrompt.js';
import { OrchestratorPrompts } from './types.js';

export const createPrompts = async (customInstructions?: {
  inputInstructions?: string;
  messageSummaryInstructions?: string;
  finishWorkflowInstructions?: string;
  decisionInstructions?: string;
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
  const decisionPrompt = await createDecisionPrompt(customInstructions?.decisionInstructions);
  return {
    inputPrompt,
    messageSummaryPrompt,
    finishWorkflowPrompt,
    decisionPrompt,
  };
};
