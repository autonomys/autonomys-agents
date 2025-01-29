import { Annotation, END, MemorySaver, START, StateGraph } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { parseMessageContent } from '../utils.js';
import { config } from '../../../config/index.js';
import { createLogger } from '../../../utils/logger.js';
import { EngagementDecision, TwitterWorkflowConfig } from './types.js';
import { createTools } from './tools.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createTwitterApi } from '../../../services/twitter/client.js';
import { createNodes } from './nodes.js';
import { Tweet } from '../../../services/twitter/types.js';
import { summarySchema, trendSchema } from './schemas.js';
import { z } from 'zod';
import { createPrompts } from './prompts.js';
import { LLMFactory } from '../../../services/llm/factory.js';

export const logger = createLogger('agent-workflow');

type TrendAnalysis = z.infer<typeof trendSchema>;
type Summary = z.infer<typeof summarySchema>;

export const State = Annotation.Root({
  messages: Annotation<readonly BaseMessage[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  timelineTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (_, update) => new Set([...update]),
  }),
  mentionsTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (_, update) => new Set([...update]),
  }),
  myRecentTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (_, update) => new Set([...update]),
  }),
  myRecentReplies: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (_, update) => new Set([...update]),
  }),
  summary: Annotation<Summary>,
  engagementDecisions: Annotation<EngagementDecision[]>({
    default: () => [],
    reducer: (_, update) => update,
  }),
  trendAnalysisTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (_, update) => new Set([...update]),
  }),
  trendAnalysis: Annotation<TrendAnalysis>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dsnData: Annotation<Record<string, any>[]>({
    default: () => [],
    reducer: (_, update) => update,
  }),
  processedTweetIds: Annotation<Set<string>>({
    default: () => new Set(),
    reducer: (curr, update) => {
      const newSet = new Set([...curr, ...update]);
      return new Set(Array.from(newSet).slice(-config.memoryConfig.MAX_PROCESSED_IDS));
    },
  }),
  repliedToTweetIds: Annotation<Set<string>>({
    default: () => new Set(),
    reducer: (_, update) => new Set([...update]),
  }),
});

const createWorkflowConfig = async (): Promise<TwitterWorkflowConfig> => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const { nodes } = config.llmConfig;

  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const { tools } = createTools(twitterApi);
  const toolNode = new ToolNode(tools);
  const prompts = await createPrompts();

  return {
    twitterApi,
    toolNode,
    prompts,
    llms: {
      decision: LLMFactory.createModel(nodes.decision),
      analyze: LLMFactory.createModel(nodes.analyze),
      generation: LLMFactory.createModel(nodes.generation),
      response: LLMFactory.createModel(nodes.response),
    },
  };
};

export const getWorkflowConfig = (() => {
  let workflowConfigInstance: TwitterWorkflowConfig | null = null;

  return async (): Promise<TwitterWorkflowConfig> => {
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
    .addNode('summaryNode', nodes.summaryNode)
    .addNode('engagementNode', nodes.engagementNode)
    .addNode('analyzeTrendNode', nodes.analyzeTrendNode)
    .addNode('generateTweetNode', nodes.generateTweetNode)
    .addNode('uploadToDsnNode', nodes.uploadToDsnNode)
    .addEdge(START, 'collectDataNode')
    .addEdge('collectDataNode', 'summaryNode')
    .addEdge('summaryNode', 'engagementNode')
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
      return { completionTime: new Date().toISOString(), completionSuccess: true };
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
