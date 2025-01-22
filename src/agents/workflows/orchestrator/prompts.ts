import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { SystemMessage } from '@langchain/core/messages';

export const createPrompts = async () => {
  const inputSystemPrompt = await PromptTemplate.fromTemplate(
    `You are a helpful assistant helping orchestrate tasks.`,
  ).format({});

  const inputPrompt = ChatPromptTemplate.fromMessages([
    new SystemMessage(inputSystemPrompt),
    [
      'human',
      `Based on the following message, determine what should be done next or just answer to the best of your ability.
      Message: {message}`,
    ],
  ]);

  return { inputPrompt };
};
