import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { MessageContent } from '@langchain/core/messages';
import { config } from '../../../config/index.js';
import { createLogger } from '../../../utils/logger.js';
import { WorkflowConfig } from './types.js';
import { createTools } from '../tools.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createTwitterAPI, TwitterAPI } from '../../../services/twitter/client.js';
import { createNodes } from './nodes.js';
import { Tweet } from '../../../services/twitter/types.js';
import { trendSchema } from './schemas.js';
import { z } from 'zod';

export const logger = createLogger('agent-workflow');

export const parseMessageContent = (content: MessageContent): any => {
  if (typeof content === 'string') {
    return JSON.parse(content);
  }
  if (Array.isArray(content)) {
    return JSON.parse(JSON.stringify(content));
  }
  return content;
};

type TrendAnalysis = z.infer<typeof trendSchema>;

export const State = Annotation.Root({
  messages: Annotation<readonly BaseMessage[]>({
    reducer: (curr, prev) => [...curr, ...prev],
    default: () => [],
  }),
  timelineTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (curr, prev) => new Set([...curr, ...prev]),
  }),
  trendAnalysis: Annotation<TrendAnalysis>({
    default: () => ({
      trends: [],
      summary: '',
    }),
    reducer: (curr, _) => ({
      trends: curr.trends,
      summary: curr.summary,
    }),
  }),
});

const createWorkflowConfig = async (): Promise<WorkflowConfig> => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const { LARGE_LLM_MODEL, SMALL_LLM_MODEL } = config.llmConfig;
  const twitterAPI = await createTwitterAPI(USERNAME, PASSWORD, COOKIES_PATH);
  const { tools } = createTools(twitterAPI);

  return {
    twitterAPI,
    toolNode: new ToolNode(tools),
    llms: {
      decision: new ChatOpenAI({
        modelName: SMALL_LLM_MODEL,
        temperature: 0.2,
      }),

      tone: new ChatOpenAI({
        modelName: SMALL_LLM_MODEL,
        temperature: 0.3,
      }),

      response: new ChatOpenAI({
        modelName: LARGE_LLM_MODEL,
        temperature: 0.8,
      }),
    },
  };
};

export const getWorkflowConfig = (() => {
  let workflowConfigInstance: WorkflowConfig | null = null;

  return async (): Promise<WorkflowConfig> => {
    if (!workflowConfigInstance) {
      workflowConfigInstance = await createWorkflowConfig();
    }
    return workflowConfigInstance;
  };
})();

const hasMessages = (state: typeof State.State): boolean => state.messages.length > 0;

const getLastMessageContent = (state: typeof State.State) => {
  if (!hasMessages(state)) return null;

  const lastMessage = state.messages[state.messages.length - 1];
  try {
    return parseMessageContent(lastMessage.content);
  } catch (error) {
    logger.error('Error parsing message content:', error);
    return null;
  }
};

const shouldContinue = (state: typeof State.State) => {
  const content = getLastMessageContent(state);

  logger.debug('Evaluating workflow continuation', {
    hasMessages: hasMessages(state),
    timelineTweetsCount: state.timelineTweets.size,
    content: content ? 'present' : 'missing',
  });

  if (state.trendAnalysis.trends.length > 0) return END;
  return START;
};

// Workflow creation function
export const createWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
  return new StateGraph(State)
    .addNode('collectDataNode', nodes.collectDataNode)
    .addNode('analyzeTrendNode', nodes.analyzeTrendNode)
    .addEdge(START, 'collectDataNode')
    .addEdge('collectDataNode', 'analyzeTrendNode')
    .addConditionalEdges('analyzeTrendNode', shouldContinue);
};

// Workflow runner type
type WorkflowRunner = Readonly<{
  runWorkflow: () => Promise<unknown>;
}>;

// Create workflow runner
const createWorkflowRunner = async (): Promise<WorkflowRunner> => {
  const workflowConfig = await getWorkflowConfig();
  const nodes = await createNodes(workflowConfig);
  const workflow = await createWorkflow(nodes);
  const memoryStore = new MemorySaver();
  const app = workflow.compile({ checkpointer: memoryStore });

  return {
    runWorkflow: async () => {
      const threadId = `workflow_${Date.now()}`;
      logger.info('Starting tweet response workflow', { threadId });

      const config = {
        recursionLimit: 50,
        configurable: {
          thread_id: threadId,
        },
      };

      const stream = await app.stream({}, config);
      let finalState = {};

      for await (const state of stream) {
        finalState = state;
      }

      logger.info('Workflow completed', { threadId });
      return finalState;
    },
  };
};

export const getWorkflowRunner = (() => {
  let runnerPromise: Promise<WorkflowRunner> | null = null;

  return () => {
    if (!runnerPromise) {
      runnerPromise = createWorkflowRunner();
    }
    return runnerPromise;
  };
})();

export const runWorkflow = async () => {
  const runner = await getWorkflowRunner();
  return runner.runWorkflow();
};
