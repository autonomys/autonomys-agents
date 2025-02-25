import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorStateType, Tools } from '../types.js';
import { workflowControlParser } from './inputPrompt.js';
import { VectorDB } from '../../../../services/vectorDb/VectorDB.js';
import { LLMConfiguration } from '../../../../services/llm/types.js';
import { ChatPromptTemplate } from '@langchain/core/prompts';

const logger = createLogger('orchestrator-input-node');

const parseWorkflowControl = async (content: unknown) => {
  if (
    typeof content === 'string' &&
    content != '' &&
    JSON.stringify(content).includes('shouldStop')
  ) {
    try {
      logger.info('Parsing workflow control:', { content });
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
    logger.info('MODEL CONFIG:', { modelConfig });
    const { messages, executedTools } = state;
    logger.debug('Running input node with messages:', {
      messages: messages.map(message => message.content),
    });
    logger.debug('Executed Tools:', { executedTools });

    const availableTools = tools.map(tool => ({ name: tool.name }));

    const formattedPrompt = await inputPrompt.format({
      messages: messages.map(message => message.content),
      executedTools: executedTools?.map(tool => tool),
      availableTools: availableTools,
    });

    logger.debug('Formatted Prompt:', { formattedPrompt });

    const result = await LLMFactory.createModel(modelConfig)
      .bindTools(tools)
      .invoke(formattedPrompt);

    const toolCalls = result.tool_calls;

    logger.debug('Tool Calls:', { toolCalls });
    const usage = result.additional_kwargs?.usage as
      | { input_tokens: number; output_tokens: number }
      | undefined;
    logger.info('Result:', {
      content: result.content,
      inputTokens: usage?.input_tokens,
      outputTokens: usage?.output_tokens,
    });

    if (
      !JSON.stringify(result.content).includes('experience_vector_db_search') &&
      result.content != ''
    ) {
      const _insertData = await vectorStore.insert(JSON.stringify(result.content));
    }

    const workflowControl = await parseWorkflowControl(result.content);

    const newMessage = { messages: [result] };
    if (workflowControl) {
      return { ...newMessage, workflowControl, toolCalls };
    }
    return { ...newMessage, toolCalls };
  };
  return runNode;
};
