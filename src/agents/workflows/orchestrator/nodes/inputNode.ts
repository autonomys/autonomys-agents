import { createLogger } from '../../../../utils/logger.js';
import { OrchestratorConfig, OrchestratorState } from '../types.js';
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
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

    const docs = messages.map((msg, i) => new Document({
      pageContent: JSON.stringify(msg.content),
      metadata: { index: i, type: msg._getType() }
    }));
    
    await inMemoryVectorStore.addDocuments(docs);

    const relevantDocs = await inMemoryVectorStore.similaritySearch(
      JSON.stringify(messages[messages.length - 1].content),
      3
    );

    const relevantMessages = relevantDocs.map(doc => ({
      content: JSON.parse(doc.pageContent),
      type: doc.metadata.type
    }));

    logger.info('Relevant messages:', { relevantMessages });

    const formattedPrompt = await prompts.inputPrompt.format({
      messages: relevantMessages.map(message => message.content),
    });
    
    logger.info('Formatted prompt with relevant context:', { formattedPrompt });
    const result = await orchestratorModel.invoke(formattedPrompt);
    logger.info('Result:', { result });

    return {
      messages: [result],
    };
  };
  
  return runNode;
};
