import { ChatOpenAI } from "@langchain/openai";
import { StateGraph, Annotation, MemorySaver, START, END } from "@langchain/langgraph";
import { HumanMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { blockchainTools } from './tools';
import { config } from "../config/index";
import logger from "../logger";
import { createThreadStorage } from "./threadStorage";
import { ThreadState } from "../types";

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
        // Construct the context from tool results
        const toolContext = state.toolResults.length > 0
            ? `\nPrevious tool results:\n${state.toolResults.join('\n')}`
            : '';

        // System message to guide the agent's behavior
        const systemMessage = new SystemMessage({
            content: `You are a friendly and helpful AI assistant. 
            - Engage naturally in conversation and remember details users share about themselves
            - When blockchain operations are needed, you can check balances and perform transactions`
        });

        // Only include tool context if it exists
        const messages = [
            systemMessage,
            ...state.messages,
            ...(toolContext ? [new HumanMessage({ content: toolContext })] : [])
        ];

        const response = await model.invoke(messages);

        return { messages: [response] };
    } catch (error) {
        logger.error("Error in agent node:", error);
        throw error;
    }
};

const toolExecutionNode = async (state: typeof StateAnnotation.State) => {
    try {
        logger.info('Tool execution node - Starting tool execution');

        const lastMessage = state.messages[state.messages.length - 1];
        const toolCalls = lastMessage.additional_kwargs?.tool_calls || [];

        if (!toolCalls.length) {
            logger.info('No tool calls found');
            return { messages: [], toolResults: [] };
        }

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
    const lastMessage = state.messages[state.messages.length - 1];

    // If the last message is from the agent (AI)
    if (lastMessage._getType() === 'ai') {
        // Check if there are tool calls that need to be executed
        const toolCalls = lastMessage.additional_kwargs?.tool_calls || [];
        if (toolCalls.length > 0) {
            return 'tools'; // Continue to tools if we have tool calls
        }

        // If no tool calls, end the conversation
        return END;
    }

    // If the message is from human, continue to agent
    return 'agent';
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
    async handleMessage({ message, threadId }: { message: string; threadId?: string }) {
        try {
            if (!agentGraph) {
                throw new Error("Blockchain agent not initialized");
            }

            const currentThreadId = threadId || `blockchain_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            logger.info('BlockchainAgent - Processing message', {
                currentThreadId,
                hasExistingThread: !!threadId
            });

            const previousState = threadId ? await threadStorage.loadThread(threadId) : null;

            const initialState = {
                messages: previousState ? [
                    ...previousState.state.messages,
                    new HumanMessage({ content: message })
                ] : [
                    new SystemMessage({
                        content: `You are a helpful AI assistant. You can engage in general conversation and also help with blockchain operations like checking balances and performing transactions.`
                    }),
                    new HumanMessage({ content: message })
                ],
                toolCalls: previousState?.state.toolCalls || [],
                toolResults: previousState?.state.toolResults || []
            } as typeof StateAnnotation.State;

            const config = {
                configurable: { thread_id: currentThreadId }
            };

            const result = await agentGraph.invoke(initialState, config);

            // Get the last message
            const lastMessage = result.messages[result.messages.length - 1];
            const response = typeof lastMessage.content === 'object'
                ? JSON.stringify(lastMessage.content, null, 2)
                : lastMessage.content;

            await threadStorage.saveThread(currentThreadId, {
                state: result,
                lastOutput: {
                    response,
                    toolCalls: result.toolCalls || [],
                    toolResults: result.toolResults || []
                }
            });

            return {
                threadId: currentThreadId,
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