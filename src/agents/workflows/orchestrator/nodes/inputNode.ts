/*eslint-disable no-template-curly-in-string */
import { SystemMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({ orchestratorModelWithTools }: OrchestratorConfig) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    const lastMessage = messages.at(-1);
    logger.info('Running input node with message:', { lastMessage });
    const prompt = await ChatPromptTemplate.fromMessages([
      new SystemMessage('You are a helpful assistant that can helping orchestrate tasks.'),
      [
        'human',
        'Based on the following message, determine what we should do next or just answer to the best of your ability.\n\n${message}',
      ],
    ]).format({
      message: lastMessage?.content,
    });

    const result = await orchestratorModelWithTools.invoke(prompt);
    return { messages: [result] };
  };
  return runNode;
};
