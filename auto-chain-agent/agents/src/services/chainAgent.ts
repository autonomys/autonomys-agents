import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, MemorySaver, START, END } from "@langchain/langgraph";
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
    }),
    toolResults: Annotation<string[]>({
        reducer: (curr, next) => [...curr, ...next],
        default: () => [],
    })
});

// Initialize core components
const model = new ChatOpenAI({
    openAIApiKey: config.openaiApiKey,
    modelName: "gpt-4o-mini",
    temperature: 0.7,
}).bindTools(blockchainTools);

const threadStorage = createThreadStorage();
const checkpointer = new MemorySaver();

// Create ToolNode instance
const toolNode = new ToolNode(blockchainTools);

// Define node functions
const agentNode = async (state: typeof StateAnnotation.State) => {
    try {
        // If we have tool results, add them to the context
        const toolContext = state.toolResults.length > 0
            ? `\nTool Results: ${state.toolResults.join('\n')}`
            : '';

        const response = await model.invoke([
            ...state.messages,
            new HumanMessage({ content: `Please process the following information and respond naturally.${toolContext}` })
        ]);

        return { messages: [response] };
    } catch (error) {
        logger.error("Error in agent node:", error);
        throw error;
    }
};

const toolExecutionNode = async (state: typeof StateAnnotation.State) => {
    try {
        logger.info('Tool execution node - Starting tool execution');

        const toolResponse = await toolNode.invoke({
            messages: state.messages
        });

        if (!toolResponse?.messages?.length) {
            logger.info('No tool response messages');
            return { messages: [], toolResults: [] };
        }

        logger.info('Tool execution completed');

        return {
            messages: toolResponse.messages,
            toolResults: toolResponse.messages.map((m: any) => m.content.toString())
        };
    } catch (error) {
        logger.error("Error in tool execution:", error);
        return { messages: [], toolResults: [] };
    }
};

// Add shouldContinue function
const shouldContinue = (state: typeof StateAnnotation.State) => {
    // Get the last message
    const lastMessage = state.messages[state.messages.length - 1];

    // If the last message is from the agent (AI) and doesn't contain tool calls,
    // we can end the conversation
    if (lastMessage._getType() === 'ai' &&
        (!lastMessage.additional_kwargs?.tool_calls ||
            lastMessage.additional_kwargs.tool_calls.length === 0)) {
        return END;
    }

    // If we've gone through too many iterations, end to prevent infinite loops
    if (state.messages.length > 3) {
        logger.info('Reached maximum iterations, ending conversation');
        return END;
    }

    // Continue to tools if we have more work to do
    return 'tools';
};

// Create and initialize the graph
const createBlockchainGraph = async () => {
    try {
        const graph = new StateGraph(StateAnnotation)
            .addNode("agent", agentNode)
            .addNode("tools", toolExecutionNode)
            .addEdge(START, "agent")
            .addConditionalEdges("agent", shouldContinue)
            .addEdge("tools", "agent");

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

            const initialState = {
                messages: [
                    new HumanMessage({
                        content: `You are a helpful blockchain assistant that can check balances and perform transactions. 
                        User Query: ${message}`
                    })
                ],
                toolCalls: [],
                toolResults: []
            };

            const config = {
                configurable: { thread_id: threadId }
            };

            const result = await agentGraph.invoke(initialState, config);

            // Get the last message
            const lastMessage = result.messages[result.messages.length - 1];
            const response = typeof lastMessage.content === 'object'
                ? JSON.stringify(lastMessage.content, null, 2)
                : lastMessage.content;

            await threadStorage.saveThread(threadId, {
                state: result,
                lastOutput: {
                    response,
                    toolCalls: result.toolCalls || [],
                    toolResults: result.toolResults || []
                }
            });

            return {
                threadId,
                response,
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