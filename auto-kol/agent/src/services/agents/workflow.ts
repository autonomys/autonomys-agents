import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { MessageContent } from '@langchain/core/messages';
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';
import { createTools } from '../../tools/index.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createTwitterClientScraper, ExtendedScraper } from '../twitter/api.js';
export const logger = createLogger('agent-workflow');
import { createNodes } from './nodes.js';

export const parseMessageContent = (content: MessageContent): any => {
  if (typeof content === 'string') {
    return JSON.parse(content);
  }
  if (Array.isArray(content)) {
    return JSON.parse(JSON.stringify(content));
  }
  return content;
};

export const State = Annotation.Root({
  messages: Annotation<readonly BaseMessage[]>({
    reducer: (curr, prev) => [...curr, ...prev],
    default: () => [],
  }),
  processedTweets: Annotation<ReadonlySet<string>>({
    default: () => new Set(),
    reducer: (curr, prev) => new Set([...curr, ...prev]),
  }),
  lastProcessedId: Annotation<string | undefined>(),
});

export type WorkflowConfig = Readonly<{
  client: ExtendedScraper;
  toolNode: ToolNode;
  llms: Readonly<{
    decision: ChatOpenAI;
    tone: ChatOpenAI;
    response: ChatOpenAI;
  }>;
}>;

const createWorkflowConfig = async (): Promise<WorkflowConfig> => {
  const client = await createTwitterClientScraper();
  const { tools } = createTools(client);

  return {
    client,
    toolNode: new ToolNode(tools),
    llms: {
      decision: new ChatOpenAI({
        modelName: config.LLM_MODEL,
        temperature: 0.2,
      }) as unknown as ChatOpenAI,

      tone: new ChatOpenAI({
        modelName: config.LLM_MODEL,
        temperature: 0.3,
      }) as unknown as ChatOpenAI,

      response: new ChatOpenAI({
        modelName: config.LLM_MODEL,
        temperature: 0.8,
      }) as unknown as ChatOpenAI,
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

const shouldContinue = (state: typeof State.State) => {
  const lastMessage = state.messages[state.messages.length - 1];
  const content = parseMessageContent(lastMessage.content);

  logger.debug('Evaluating workflow continuation', {
    hasMessages: state.messages.length > 0,
    currentIndex: content.currentTweetIndex,
    totalTweets: content.tweets?.length,
    hasBatchToAnalyze: !!content.batchToAnalyze?.length,
    hasBatchToRespond: !!content.batchToRespond?.length,
    batchProcessing: content.batchProcessing,
  });

  // Handle auto-approval flow
  if (!content.fromAutoApproval && content.batchToFeedback?.length > 0) {
    return 'autoApprovalNode';
  }

  if (content.fromAutoApproval) {
    if (content.batchToRespond?.length > 0) {
      return 'generateNode';
    } else {
      return 'engagementNode';
    }
  }

  // Handle batch processing flow
  if (content.batchToAnalyze?.length > 0) {
    return 'analyzeNode';
  }

  if (content.batchToRespond?.length > 0) {
    return 'generateNode';
  }
  // Check if we've processed all tweets
  if (
    (!content.tweets || content.currentTweetIndex >= content.tweets.length) &&
    content.pendingEngagements?.length === 0
  ) {
    if (content.fromRecheckNode && content.messages?.length === 0) {
      logger.info('Workflow complete - no more tweets to process');
      return END;
    }
    logger.info('Moving to recheck skipped tweets');
    return 'recheckNode';
  }
  return 'engagementNode';
};

// Workflow creation function
export const createWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
  return new StateGraph(State)
    .addNode('mentionNode', nodes.mentionNode)
    .addNode('timelineNode', nodes.timelineNode)
    .addNode('searchNode', nodes.searchNode)
    .addNode('engagementNode', nodes.engagementNode)
    .addNode('analyzeNode', nodes.toneAnalysisNode)
    .addNode('generateNode', nodes.responseGenerationNode)
    .addNode('autoApprovalNode', nodes.autoApprovalNode)
    .addNode('recheckNode', nodes.recheckSkippedNode)
    .addEdge(START, 'mentionNode')
    .addEdge('mentionNode', 'timelineNode')
    .addEdge('timelineNode', 'searchNode')
    .addEdge('searchNode', 'engagementNode')
    .addConditionalEdges('engagementNode', shouldContinue)
    .addConditionalEdges('analyzeNode', shouldContinue)
    .addConditionalEdges('generateNode', shouldContinue)
    .addConditionalEdges('autoApprovalNode', shouldContinue)
    .addConditionalEdges('recheckNode', shouldContinue);
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
