import { createLogger } from '../../utils/logger.js';
import { LLMSize } from '../../services/llm/types.js';
import { LLMFactory } from '../../services/llm/factory.js';

const logger = createLogger('summarize-results-tool');

export async function summarizeResults(data: any): Promise<{ summary: string }> {
  logger.info('Summarizing results with data:', JSON.stringify(data, null, 2));
  try {
    const llm = LLMFactory.createModel({
      size: LLMSize.LARGE,
      temperature: 0.2,
    });

    try {
      const result = await llm.invoke(
        `
        Summarize the following content in a structured format:

        Input: ${JSON.stringify(data, null, 2)}
        
        Requirements:
        - Provide a comprehensive info on what was the goal/task, and what was the outcome. (e.g. "TASK: fetching mentioned tweets")
        - A task is completed if you can see the outcome. Otherwise, it's pending.
        - Start with "STATUS: COMPLETED" or "STATUS: PENDING" as first line
        - Directly address the key information
        - IDs are IMPORTANT. Include them in the summary.
        - Use bullet points and clear headers
        - No narrative framing (avoid phrases like "This appears to be" or "I found")
        - Group similar information together
        - Preserve all:
          * Numerical values and IDs
          * Technical details and data structures
          * Error states and conditions
          * Chronological order
          * Tool parameters and requirements
        
        IMPORTANT: Your summary must be functionally equivalent to the original.
        
        Format your response as a structured summary with clear sections.`,
      );
      const summary = result.content as string;
      logger.info('Summarized results:', { summary });
      return { summary };
    } catch (error) {
      logger.error('Error summarizing results:', error);
      return { summary: 'Error summarizing results' };
    }
  } catch (error) {
    logger.error('Error summarizing results:', error);
    throw error;
  }
}
