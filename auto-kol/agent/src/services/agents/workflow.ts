import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { AIMessage, BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { MessageContent } from '@langchain/core/messages';
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';
import { createTools } from '../../tools/index.js';
import { createTwitterClient } from '../twitter/api.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { TwitterApiReadWrite } from 'twitter-api-v2';
import { StructuredOutputParser } from 'langchain/output_parsers';
export  const logger = createLogger('agent-workflow');
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

// State management with processed tweets tracking
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

// Workflow configuration type
export type WorkflowConfig = Readonly<{
    client: TwitterApiReadWrite;
    toolNode: ToolNode;
    llms: Readonly<{
        decision: ChatOpenAI;
        tone: ChatOpenAI;
        response: ChatOpenAI;
    }>;
}>;

// Create workflow configuration
const createWorkflowConfig = async (): Promise<WorkflowConfig> => {
    // SHOULD BE REPLACED WITH SCRAPER AGENT
    const client = await createTwitterClient({
        appKey: config.TWITTER_API_KEY!,
        appSecret: config.TWITTER_API_SECRET!,
        accessToken: config.TWITTER_ACCESS_TOKEN!,
        accessSecret: config.TWITTER_ACCESS_SECRET!
    });

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
            }) as unknown as ChatOpenAI
        }
    };
};


const shouldContinue = (state: typeof State.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = parseMessageContent(lastMessage.content);

    // If we have no tweets or finished processing all tweets, end workflow
    if (!content.tweets || content.currentTweetIndex >= content.tweets.length) {
        if (content.fromRecheckNode && content.messages?.length === 0) {
            return END;
        }
        return `recheckNode`;
    }

    // If this is a completed tweet (has responseStrategy or was skipped), 
    // go back to engagement node for next tweet
    if (content.responseStrategy ||
        (content.decision && !content.decision.shouldEngage)) {
        return 'engagementNode';
    }

    // If we have an engagement decision and should engage, move to tone analysis
    if (content.decision && content.decision.shouldEngage) {
        return 'analyzeNode';
    }
    // If we have toneAnalysis, move to generate response
    if (content.toneAnalysis) {
        return 'generateNode';
    }

    return 'engagementNode';
};

// Workflow creation function
export const createWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
    return new StateGraph(State)
        .addNode('searchNode', nodes.searchNode)
        .addNode('engagementNode', nodes.engagementNode)
        .addNode('analyzeNode', nodes.toneAnalysisNode)
        .addNode('generateNode', nodes.responseGenerationNode)
        .addNode('recheckNode', nodes.recheckSkippedNode)
        .addEdge(START, 'searchNode')
        .addEdge('searchNode', 'engagementNode')
        .addConditionalEdges('engagementNode', shouldContinue)
        .addConditionalEdges('analyzeNode', shouldContinue)
        .addConditionalEdges('generateNode', shouldContinue)
        .addConditionalEdges('recheckNode', shouldContinue);
};

// Workflow runner type
type WorkflowRunner = Readonly<{
    runWorkflow: () => Promise<unknown>;
}>;

// Create workflow runner
const createWorkflowRunner = async (): Promise<WorkflowRunner> => {
    const workflowConfig = await createWorkflowConfig();
    const nodes = await createNodes(workflowConfig);
    const workflow = await createWorkflow(nodes);
    const memoryStore = new MemorySaver();
    const app = workflow.compile({ checkpointer: memoryStore });

    return {
        runWorkflow: async () => {
            const threadId = `workflow_${Date.now()}`;
            logger.info('Starting tweet response workflow', { threadId });

            const config = {
                recursionLimit: 100,
                configurable: {
                    thread_id: threadId
                }
            };

            const stream = await app.stream({}, config);
            let finalState = {};

            for await (const state of stream) {
                finalState = state;
            }

            logger.info('Workflow completed', { threadId });
            return finalState;
        }
    };
};

// Export a single async function to get the workflow runner
export const getWorkflowRunner = (() => {
    let runnerPromise: Promise<WorkflowRunner> | null = null;

    return () => {
        if (!runnerPromise) {
            runnerPromise = createWorkflowRunner();
        }
        return runnerPromise;
    };
})();

// Export the run function for external use
export const runWorkflow = async () => {
    const runner = await getWorkflowRunner();
    return runner.runWorkflow();
};