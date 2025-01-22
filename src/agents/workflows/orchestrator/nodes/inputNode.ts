import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';

const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({ orchestratorModel, prompts }: OrchestratorConfig) => {
  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    const lastMessage = messages.at(-1)?.content;
    logger.info('Running input node with message:', { lastMessage });
    const formattedPrompt = await prompts.inputPrompt.format({ message: lastMessage });

    const result = await orchestratorModel.invoke(formattedPrompt);
    return { messages: [result] };
  };
  return runNode;
};
