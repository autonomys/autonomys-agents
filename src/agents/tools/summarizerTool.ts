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
        You are a helpful assistant that summarizes the results of a tool call.
        Keep the purpose of the tool call in mind.
        Summarize the following content while strictly preserving:
        1. All numerical values and IDs
        2. Key action items and decisions
        3. Status updates and outcomes
        4. Error messages or warnings
        5. User requests and commands
        6. Tool names and their parameters
        7. Response formats and requirements

        Original content:
        ${JSON.stringify(data, null, 2)}
        
        Rules for summarization:
        - Keep all technical details intact
        - Maintain data structure references
        - Preserve error states and conditions
        - Keep tool invocation details
        - Maintain chronological order of events
        - Keep all JSON structure requirements
        
        IMPORTANT: Your summary must be functionally equivalent to the original.`
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
