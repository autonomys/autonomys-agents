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
import { createTools } from './tools.js';
import { createNodes } from './nodes.js';
import { OrchestratorConfig, OrchestratorInput, OrchestratorState } from './types.js';
import { createPrompts } from './prompts.js';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { createTwitterApi } from '../../../services/twitter/client.js';
import { workflowControlParser } from './prompts.js';
import { VectorDB } from '../../../services/vectorDb/VectorDB.js';

const logger = createLogger('orchestrator-workflow');

export const createWorkflowConfig = async (): Promise<OrchestratorConfig> => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const vectorDb = new VectorDB('data/orchestrator');

  const { tools } = createTools(twitterApi, vectorDb);
  const toolNode = new ToolNode(tools);
  const orchestratorModel = LLMFactory.createModel(config.llmConfig.nodes.orchestrator).bind({
    tools,
  });
  const prompts = await createPrompts();
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

  const contentStr =
    typeof lastMessage.content === 'string'
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

  try {
    const match = contentStr.match(/\{[\s\S]*"shouldStop"[\s\S]*\}/);
    if (match) {
      const control = workflowControlParser.parse(JSON.parse(match[0]));
      if (control.shouldStop) {
        logger.info('Workflow stop requested', { reason: control.reason });
        return END;
      }
    }
  } catch (error) {
    logger.warn('Failed to parse workflow control', { error });
    return 'END';
  }

  return 'tools';
};

const createOrchestratorWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
  const workflow = new StateGraph(OrchestratorState)
    .addNode('input', nodes.inputNode)
    .addNode('tools', nodes.toolNode)
    .addEdge(START, 'input')
    .addEdge('tools', 'input')
    .addConditionalEdges('input', handleConditionalEdge);
  return workflow;
};

type OrchestratorRunner = Readonly<{
  runWorkflow: (input?: OrchestratorInput) => Promise<unknown>;
}>;

const createOrchestratorRunner = async (): Promise<OrchestratorRunner> => {
  const workflowConfig = await createWorkflowConfig();
  const nodes = await createNodes(workflowConfig);
  const workflow = await createOrchestratorWorkflow(nodes);
  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async (input?: OrchestratorInput) => {
      const threadId = 'orchestrator_workflow_state';
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

// Create workflow runner with caching
export const getOrchestratorRunner = (() => {
  let runnerPromise: Promise<OrchestratorRunner> | null = null;

  return () => {
    if (!runnerPromise) {
      runnerPromise = createOrchestratorRunner();
    }
    return runnerPromise;
  };
})();

export const runOrchestratorWorkflow = async (input: string) => {
  const messages = [new HumanMessage({ content: input })];
  const runner = await getOrchestratorRunner();
  return runner.runWorkflow({ messages });
};
