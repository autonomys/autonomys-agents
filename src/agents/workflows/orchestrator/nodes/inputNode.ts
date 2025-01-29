import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { summarizeResults } from '../../../tools/summarizerTool.js';
import { config as appConfig } from '../../../../config/index.js';

const logger = createLogger('orchestrator-input-node');

export const createInputNode = ({ orchestratorModel, prompts }: OrchestratorConfig) => {
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: appConfig.llmConfig.OPENAI_API_KEY,
    modelName: "text-embedding-3-small"
  });
  const inMemoryVectorStore = new MemoryVectorStore(embeddings);
  
  const runNode = async (state: typeof OrchestratorState.State) => {
    const { messages } = state;
    logger.info('Running input node with messages:', { messages });

    // First, summarize the new message
    const latestMessage = messages[messages.length - 1];
    const summarizedMessage = await summarizeResults(latestMessage.content);
    // Store both original and summarized versions
    const docs = [
      new Document({
        pageContent: JSON.stringify(summarizedMessage),
        metadata: { 
          index: messages.length - 1,
          type: latestMessage._getType(),
        }
      }),
    ];
    
    await inMemoryVectorStore.addDocuments(docs);

    // Search using the summarized content
    const relevantDocs = await inMemoryVectorStore.similaritySearch(
      JSON.stringify(latestMessage.content),
      3,
    );

    const relevantMessages = relevantDocs.map(doc => ({
      content: JSON.parse(doc.pageContent),
      type: doc.metadata.type
    }));  

    logger.info("relevent messages:", relevantMessages)

    const formattedPrompt = await prompts.inputPrompt.format({
      messages: relevantMessages.map(message => message.content),
    });

    // formattedPrompt:
    logger.info('Formatted prompt:', { formattedPrompt });
    
    const result = await orchestratorModel.invoke("Summarzied of previous tool call: " + formattedPrompt);
    // logger.info('Result:', { result });

    return {
      messages: [result],
    };
  };
  
  return runNode;
};
