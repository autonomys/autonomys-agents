import { LLMFactory } from '../../../../services/llm/factory.js';
import { createLogger } from '../../../../utils/logger.js';
import { LLMSize } from '../../../../services/llm/types.js';

const logger = createLogger('prompt-summarizer');

export const summarizePrompt = async (prompt: string): Promise<string> => {
  const llm = LLMFactory.createModel({
    size: LLMSize.SMALL,
    temperature: 0.2,
  });

  try {
    const result = await llm.invoke(
      `Summarize the following prompt while preserving its key instructions and context. Keep only the essential information needed for the tasks. 
      Give a summary of the execution of the tasks and the current status.

      ${prompt}
      
      IMPORTANT: Keep your summary focused and concise.`,
    );

    const summary = result.content as string;
    logger.info('Summarized prompt', {
      originalLength: prompt.length,
      summaryLength: summary.length,
    });

    return summary;
  } catch (error) {
    logger.error('Error summarizing prompt:', error);
    return prompt;
  }
};
