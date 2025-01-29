import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({ orchestratorModel, prompts }: OrchestratorConfig) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    logger.info('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });

    const formattedPrompt = await prompts.inputPrompt.format({
      messages: messages.map(message => message.content),
    });
    logger.debug('Formatted prompt:', { formattedPrompt });
    const result = await orchestratorModel.invoke(formattedPrompt);
    logger.info('Result:', { result });

    return {
      messages: [result],
    };
  };
  return runNode;
};
