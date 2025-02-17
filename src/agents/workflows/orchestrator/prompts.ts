import { createInputPrompt } from './nodes/inputPrompt.js';
import { createMessageSummaryPrompt } from './nodes/messageSummaryPrompt.js';
import { createFinishWorkflowPrompt } from './nodes/finishWorkflowPrompt.js';
import { OrchestratorPrompts } from './types.js';
import { Character } from '../../../config/characters.js';

export const createPrompts = async (
  character: Character,
  customInstructions?: {
    inputInstructions?: string;
    messageSummaryInstructions?: string;
    finishWorkflowInstructions?: string;
    selfSchedule?: boolean;
  },
): Promise<OrchestratorPrompts> => {
  const {
    inputInstructions,
    messageSummaryInstructions,
    finishWorkflowInstructions,
    selfSchedule,
  } = customInstructions || {};
  const inputPrompt = await createInputPrompt(character, inputInstructions);
  const messageSummaryPrompt = await createMessageSummaryPrompt(
    character,
    messageSummaryInstructions,
  );
  const finishWorkflowPrompt = await createFinishWorkflowPrompt(
    character,
    finishWorkflowInstructions,
    selfSchedule,
  );

  return {
    inputPrompt,
    messageSummaryPrompt,
    finishWorkflowPrompt,
  };
};
