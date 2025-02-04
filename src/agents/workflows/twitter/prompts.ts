import { createPrompts } from '../orchestrator/prompts.js';

export const createTwitterPrompts = async () => {
  const customInputInstructions = `When posting or replying to a tweet leave out the hashtages and try to keep them short (less than 230 characters).
    Do not be repetitive, use different phrases and words with each post.`;

  return await createPrompts({ inputInstructions: customInputInstructions });
};
