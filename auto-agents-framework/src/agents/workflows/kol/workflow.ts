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
import { trendSchema, summarySchema } from './schemas.js';
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
  myRecentReplies: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (curr, update) => new Set([...update]),
  }),
  summary: Annotation<Summary>,
  engagementDecisions: Annotation<EngagementDecision[]>({
    default: () => [],
    reducer: (curr, update) => update,
  }),
  trendAnalysisTweets: Annotation<ReadonlySet<Tweet>>({
    default: () => new Set(),
    reducer: (curr, update) => new Set([...update]),
  }),
  trendAnalysis: Annotation<TrendAnalysis>,
  dsnData: Annotation<Record<string, any>[]>({
    default: () => [],
    reducer: (curr, update) => update,
  }),
  processedTweetIds: Annotation<Set<string>>({
    default: () => new Set(),
    reducer: (curr, update) => new Set([...curr, ...update]),
  }),
  repliedToTweetIds: Annotation<Set<string>>({
    default: () => new Set(),
    reducer: (curr, update) => new Set([...curr, ...update]),
  }),
});

const createWorkflowConfig = async (characterFile: string): Promise<WorkflowConfig> => {
  const { USERNAME, PASSWORD, COOKIES_PATH } = config.twitterConfig;
  const { nodes } = config.llmConfig;

  const twitterApi = await createTwitterApi(USERNAME, PASSWORD, COOKIES_PATH);
  const { tools } = createTools(twitterApi);
  const toolNode = new ToolNode(tools);
  const prompts = await createPrompts(characterFile);

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
  let workflowConfigInstance: WorkflowConfig | null = null;
  let currentCharacterFile: string | null = null;

  return async (characterFile: string): Promise<WorkflowConfig> => {
    if (!workflowConfigInstance || currentCharacterFile !== characterFile) {
      currentCharacterFile = characterFile;
      workflowConfigInstance = await createWorkflowConfig(characterFile);
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
  else {
    state.repliedToTweetIds = new Set();
    return END;
  }
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
const createWorkflowRunner = async (characterFile: string): Promise<WorkflowRunner> => {
  const workflowConfig = await getWorkflowConfig(characterFile);
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
  let currentCharacterFile: string | null = null;

  return (characterFile: string) => {
    if (!runnerPromise || currentCharacterFile !== characterFile) {
      currentCharacterFile = characterFile;
      runnerPromise = createWorkflowRunner(characterFile);
    }
    return runnerPromise;
  };
})();

export const runWorkflow = async (characterFile: string) => {
  const runner = await getWorkflowRunner(characterFile);
  return runner.runWorkflow();
};
