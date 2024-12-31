import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { parseMessageContent } from '../utils.js';
import { config } from '../../../config/index.js';
import { createLogger } from '../../../utils/logger.js';
import { EngagementDecision, WorkflowConfig } from './types.js';
import { createTools } from './tools.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createTwitterApi } from '../../../services/twitter/client.js';
import { createNodes } from './nodes.js';
import { Tweet } from '../../../services/twitter/types.js';
import { trendSchema } from './schemas.js';
import { z } from 'zod';

export const logger = createLogger('agent-workflow');

type TrendAnalysis = z.infer<typeof trendSchema>;

export const State = Annotation.Root({
  messages: Annotation<readonly BaseMessage[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  timelineTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (curr, update) => new Set([...update]),
  }),
  mentionsTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (curr, update) => new Set([...update]),
  }),
  myRecentTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (curr, update) => new Set([...update]),
  }),
  engagementDecisions: Annotation<EngagementDecision[]>,
  trendAnalysis: Annotation<TrendAnalysis>,
  dsnData: Annotation<Record<string, any>[]>,
});

const createWorkflowConfig = async (): Promise<WorkflowConfig> => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const { LARGE_LLM_MODEL, SMALL_LLM_MODEL } = config.llmConfig;
  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const { tools } = createTools(twitterApi);
  const toolNode = new ToolNode(tools);

  return {
    twitterApi,
    toolNode,
    llms: {
      decision: new ChatOpenAI({
        modelName: SMALL_LLM_MODEL,
        temperature: 0.2,
      }),
      analyze: new ChatOpenAI({
        modelName: LARGE_LLM_MODEL,
        temperature: 0.5,
      }),
      generation: new ChatOpenAI({
        modelName: LARGE_LLM_MODEL,
        temperature: 0.8,
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

  logger.info('Evaluating workflow continuation', {
    hasMessages: hasMessages(state),
    timelineTweetsCount: state.timelineTweets.size,
    content: content ? 'present' : 'missing',
    dsnData: state.dsnData,
    upload: config.autoDriveConfig.AUTO_DRIVE_UPLOAD,
  });

  const hasDsnData = state.dsnData && Object.keys(state.dsnData).length > 0;

  if (hasDsnData && config.autoDriveConfig.AUTO_DRIVE_UPLOAD) return 'uploadToDsnNode';
  else return END;
};

// Workflow creation function
export const createWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
  const workflow = new StateGraph(State)
    .addNode('collectDataNode', nodes.collectDataNode)
    .addNode('engagementNode', nodes.engagementNode)
    .addNode('analyzeTrendNode', nodes.analyzeTrendNode)
    .addNode('generateTweetNode', nodes.generateTweetNode)
    .addNode('uploadToDsnNode', nodes.uploadToDsnNode)
    .addEdge(START, 'collectDataNode')
    .addEdge('collectDataNode', 'engagementNode')
    .addEdge('engagementNode', 'analyzeTrendNode')
    .addEdge('analyzeTrendNode', 'generateTweetNode')
    .addConditionalEdges('generateTweetNode', shouldContinue);
  return workflow;
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
      // Use a fixed thread ID for shared state across runs
      const threadId = 'shared_workflow_state';
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
