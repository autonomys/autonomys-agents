import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorStateType, Tools } from '../types.js';
import { workflowControlParser } from './inputPrompt.js';
import { VectorDB } from '../../../../services/vectorDb/VectorDB.js';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';
const logger = createLogger('orchestrator-input-node');

const parseWorkflowControl = async (content: unknown) => {
  if (typeof content === 'string') {
    try {
      return await workflowControlParser.parse(content);
    } catch (error) {
      logger.error('Failed to parse workflow control. Applying fallback termination.', {
        error,
        content,
      });
      return { shouldStop: true, reason: 'Failed to parse control message' };
    }
  }
  return undefined;
};

export const createInputNode = ({
  modelConfig,
  inputPrompt,
  tools,
  vectorStore,
}: {
  modelConfig: LLMConfiguration;
  inputPrompt: ChatPromptTemplate;
  tools: Tools;
  vectorStore: VectorDB;
}) => {
  const runNode = async (state: OrchestratorStateType) => {
    const { messages } = state;
    logger.info('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });

    const formattedPrompt = await inputPrompt.format({
      messages: messages.map(message => message.content),
    });

    const result = await LLMFactory.createModel(modelConfig)
      .bind({ tools })
      .invoke(formattedPrompt);

    const usage = result.additional_kwargs?.usage as
      | { input_tokens: number; output_tokens: number }
      | undefined;
    logger.info('Result:', {
      content: result.content,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
    });
    await vectorStore.insert(JSON.stringify(result.content));

    const workflowControl = await parseWorkflowControl(result.content);

    const newMessage = { messages: [result] };
    if (workflowControl) {
      return { ...newMessage, workflowControl };
    }
    return newMessage;
  };
  return runNode;
};
