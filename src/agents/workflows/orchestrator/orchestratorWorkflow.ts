import {
  BinaryOperatorAggregate,
  END,
  MemorySaver,
  START,
  StateGraph,
  StateType,
} from '@langchain/langgraph';
import { createLogger } from '../../../utils/logger.js';
import { LLMFactory } from '../../../services/llm/factory.js';
import { config } from '../../../config/index.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createNodes } from './nodes.js';
import {
  OrchestratorConfig,
  OrchestratorInput,
  OrchestratorPrompts,
  OrchestratorState,
} from './types.js';
import { BaseMessage } from '@langchain/core/messages';
import { workflowControlParser } from './prompts.js';
import { StructuredToolInterface } from '@langchain/core/tools';
import { RunnableToolLike } from '@langchain/core/runnables';

const logger = createLogger('orchestrator-workflow');

const createWorkflowConfig = async (
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
): Promise<OrchestratorConfig> => {
  const toolNode = new ToolNode(tools);
  const orchestratorModel = LLMFactory.createModel(config.llmConfig.nodes.orchestrator).bind({
    tools,
  });
  return { orchestratorModel, toolNode, prompts };
};

const handleConditionalEdge = async (
  state: StateType<{
    messages: BinaryOperatorAggregate<readonly BaseMessage[], readonly BaseMessage[]>;
    error: BinaryOperatorAggregate<Error | null, Error | null>;
  }>,
) => {
  logger.debug('State in conditional edge', { state });

  const lastMessage = state.messages[state.messages.length - 1];
  if (!lastMessage?.content) return 'tools';

  try {
    // TODO: Revisit this process, this is quite hacky
    // Handle both string and object content
    const contentStr =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (lastMessage.content as any).kwargs?.content || JSON.stringify(lastMessage.content);

    // Try to parse the entire content as JSON first
    try {
      const parsedContent = JSON.parse(contentStr);
      if ('shouldStop' in parsedContent) {
        const control = workflowControlParser.parse(parsedContent);
        logger.info('Parsed control', { control });
        if (control.shouldStop) {
          logger.info('Workflow stop requested', { reason: control.reason });
          return 'workflowSummary';
        }
      }
    } catch {
      // If direct parsing fails, try to find JSON object in the string
      const match = contentStr.match(/(\{[\s\S]*?"shouldStop":[\s\S]*?\})/);
      if (match) {
        const control = workflowControlParser.parse(JSON.parse(match[0]));
        logger.info('Parsed control', { control });
        if (control.shouldStop) {
          logger.info('Workflow stop requested', { reason: control.reason });
          return 'workflowSummary';
        }
      }
    }
    return 'tools';
  } catch (error) {
    logger.warn('Failed to parse workflow control', { error, content: lastMessage.content });
    return END;
  }
};

const createOrchestratorWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
  const workflow = new StateGraph(OrchestratorState)
    .addNode('input', nodes.inputNode)
    .addNode('messageSummary', nodes.messageSummaryNode)
    .addNode('workflowSummary', nodes.workflowSummaryNode)
    .addNode('tools', nodes.toolNode)
    .addEdge(START, 'input')
    .addConditionalEdges('input', handleConditionalEdge)
    .addEdge('tools', 'messageSummary')
    .addEdge('messageSummary', 'input')
    .addEdge('workflowSummary', END);

  return workflow;
};

export type OrchestratorRunner = Readonly<{
  runWorkflow: (input?: OrchestratorInput, options?: { threadId?: string }) => Promise<unknown>;
}>;

export const createOrchestratorRunner = async (
  tools: (StructuredToolInterface | RunnableToolLike)[],
  prompts: OrchestratorPrompts,
): Promise<OrchestratorRunner> => {
  const workflowConfig = await createWorkflowConfig(tools, prompts);
  const nodes = await createNodes(workflowConfig);
  const workflow = await createOrchestratorWorkflow(nodes);
  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async (input?: OrchestratorInput, options?: { threadId?: string }) => {
      const threadId = options?.threadId || 'orchestrator_workflow_state';
      logger.info('Starting orchestrator workflow', { threadId });

      const config = {
        recursionLimit: 50,
        configurable: {
          thread_id: threadId,
        },
      };

      const initialState = input || { messages: [] };
      const stream = await app.stream(initialState, config);
      let finalState = {};

      for await (const state of stream) {
        finalState = state;
      }

      logger.info('Workflow completed', { threadId });

      return finalState;
    },
  };
};

export const getOrchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | undefined = undefined;
  return ({
    prompts,
    tools,
  }: {
    prompts: OrchestratorPrompts;
    tools: (StructuredToolInterface | RunnableToolLike)[];
  }) => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner(tools, prompts);
    }
    return runnerPromise;
  };
})();
