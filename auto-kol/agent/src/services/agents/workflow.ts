import { END, MemorySaver, StateGraph, START, Annotation } from '@langchain/langgraph';
import { BaseMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { MessageContent } from '@langchain/core/messages';
import { config } from '../../config/index.js';
import { createLogger } from '../../utils/logger.js';
import { createTools } from '../../tools/index.js';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { createTwitterClientScraper } from '../twitter/api.js';
import { createWebSearchTool } from '../../tools/tools/webSearchTool.js';
import { webResearchPrompt } from './prompts.js';
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
    client: any;
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
            }) as unknown as ChatOpenAI
        }
    };
};


const shouldContinue = (state: typeof State.State) => {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = parseMessageContent(lastMessage.content);

    logger.info('State transition check:', {
        nodeType: content.nodeType,
        contentKeys: Object.keys(content),
        currentTweetIndex: content.currentTweetIndex,
        totalTweets: content.tweets?.length,
        hasDecision: !!content.decision,
        shouldEngage: content.decision?.shouldEngage
    });

    switch (content.nodeType) {
        case 'timeline_result':
            return 'searchNode';         // Timeline -> Search (to store in ChromaDB)
        case 'search_result':
            return 'engagementNode';     // Search -> Engagement decision
        case 'engagement_result':
            return content.decision?.shouldEngage ? 'analyzeNode' : 'engagementNode';  // If positive engagement -> analyze, else next tweet
        case 'tone_analysis_result':
            return 'webResearchNode';    // After tone -> web research
        case 'web_research_result':
            return 'generateNode';       // After research -> generate response
        case 'response_generation_result':
            return 'engagementNode';     // After response -> back to next tweet
        default:
            if (!content.tweets || content.currentTweetIndex >= content.tweets.length) {
                return content.fromRecheckNode && content.messages?.length === 0 ? END : 'recheckNode';
            }
            return 'engagementNode';
    }
};

// Workflow creation function
export const createWorkflow = async (nodes: Awaited<ReturnType<typeof createNodes>>) => {
    return new StateGraph(State)
        .addNode('searchNode', nodes.searchNode)
        .addNode('engagementNode', nodes.engagementNode)
        .addNode('analyzeNode', nodes.toneAnalysisNode)
        .addNode('webResearchNode', nodes.webResearchNode)
        .addNode('generateNode', nodes.responseGenerationNode)
        .addNode('recheckNode', nodes.recheckSkippedNode)
        .addNode('timelineNode', nodes.timelineNode)
        .addEdge(START, 'timelineNode')
        .addConditionalEdges('timelineNode', shouldContinue)
        .addConditionalEdges('searchNode', shouldContinue)
        .addConditionalEdges('engagementNode', shouldContinue)
        .addConditionalEdges('analyzeNode', shouldContinue)
        .addConditionalEdges('webResearchNode', shouldContinue)
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
                recursionLimit: 200, // RODO: Research how this is calculated
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