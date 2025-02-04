import { createInputPrompt } from './nodes/inputPrompt.js';
import { createMessageSummaryPrompt } from './nodes/messageSummaryPrompt.js';

export const createPrompts = async (customInstructions?: {
  inputInstructions?: string;
  messageSummaryInstructions?: string;
}) => {
  const inputPrompt = await createInputPrompt(customInstructions?.inputInstructions);
  const messageSummaryPrompt = await createMessageSummaryPrompt(
    customInstructions?.messageSummaryInstructions,
  );

  return {
    inputPrompt,
    messageSummaryPrompt,
  };
};
