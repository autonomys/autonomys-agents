import { SystemMessage } from '@langchain/core/messages';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({ orchestratorModelWithTools }: OrchestratorConfig) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    logger.info('Messages', { messages });
    const prompt = await ChatPromptTemplate.fromMessages([
      new SystemMessage('You are a helpful assistant that can helping orchestrate tasks.'),
      [
        'human',
        `Based on the following messages, determine what we should do next or just answer to the best of your ability.
        ${messages.map(m => m.content).join('\n')}
        `,
      ],
    ]).format({
      messages: messages.map(m => m.content).join('\n'),
    });
    logger.info('Prompt', { prompt });
    const result = await orchestratorModelWithTools.invoke(prompt);
    logger.info('Result', { result });
    return { messages: [result] };
  };
  return runNode;
};
