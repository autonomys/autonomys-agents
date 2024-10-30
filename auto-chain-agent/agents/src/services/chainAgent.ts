import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, Annotation, MemorySaver, START } from "@langchain/langgraph";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { blockchainTools } from './tools';
import { config } from "../config/index";
import logger from "../logger";
import { createThreadStorage } from "./threadStorage";

// Define state schema for the graph
const StateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: (curr, prev) => [...curr, ...prev],
        default: () => [],
    }),
    toolCalls: Annotation<Array<{
        name: string;
        args: Record<string, any>;
        id: string;
        type: string;
    }>>({
        reducer: (curr, next) => [...curr, ...next],
        default: () => [],
    })
});

// Initialize core components
const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-latest",
    anthropicApiKey: config.anthropicApiKey,
}).bindTools(blockchainTools);

const threadStorage = createThreadStorage();
const checkpointer = new MemorySaver();

// Create ToolNode instance
const toolNode = new ToolNode(blockchainTools);

// Define node functions
const agentNode = async (state: typeof StateAnnotation.State) => {
    const response = await model.invoke(state.messages);
    return { messages: [response] };
};

// Create and initialize the graph
const createBlockchainGraph = async () => {
    try {
        // Create the graph
        const graph = new StateGraph(StateAnnotation)
            .addNode("agent", agentNode)
            .addNode("tools", toolNode)
            .addEdge(START, "agent")
            .addEdge("agent", "tools");

        return graph.compile({ checkpointer });
    } catch (error) {
        logger.error("Failed to create blockchain graph:", error);
        throw error;
    }
};

// Initialize graph
let agentGraph: Awaited<ReturnType<typeof createBlockchainGraph>>;
(async () => {
    try {
        agentGraph = await createBlockchainGraph();
        logger.info('Blockchain agent initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize blockchain agent:', error);
    }
})();

// Export the agent interface
export const blockchainAgent = {
    async handleMessage({ message }: { message: string }) {
        try {
            if (!agentGraph) {
                throw new Error("Blockchain agent not initialized");
            }

            const threadId = `blockchain_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            logger.info('BlockchainAgent - Starting new interaction', { threadId });

            const config = {
                configurable: { thread_id: threadId }
            };

            // Run the agent graph
            const result = await agentGraph.invoke({
                messages: [new HumanMessage({ content: message })]
            }, config);

            // Get the last message
            const lastMessage = result.messages[result.messages.length - 1];

            // Store thread state
            await threadStorage.saveThread(threadId, {
                state: result,
                lastOutput: {
                    response: lastMessage.content,
                    toolCalls: result.toolCalls || []
                }
            });

            return {
                threadId,
                response: lastMessage.content,
                toolCalls: result.toolCalls || []
            };
        } catch (error) {
            logger.error("Error handling message:", error);
            throw error;
        }
    },

    async getThreadState(threadId: string) {
        return await threadStorage.loadThread(threadId);
    }
}; 