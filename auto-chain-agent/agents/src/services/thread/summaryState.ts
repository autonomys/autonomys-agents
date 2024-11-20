import fs from 'fs';
import logger from '../../logger';
import { SummaryState } from './interface';
import { saveDiffFile } from './utils';
import { config } from '../../config';

export const loadSummaryState = async (): Promise<SummaryState> => {
    try {
        if (fs.existsSync(config.SUMMARY_FILE_PATH)) {
            const data = await fs.promises.readFile(config.SUMMARY_FILE_PATH, 'utf8');
            return JSON.parse(data);
        }
        return {
            lastCheck: new Date().toISOString(),
            differences: []
        };
    } catch (error) {
        logger.error('Error loading summary state:', error);
        return {
            lastCheck: new Date().toISOString(),
            differences: []
        };
    }
};

export const saveSummaryState = async (state: SummaryState) => {
    try {
        let existingState: SummaryState | null = null;
        if (fs.existsSync(config.SUMMARY_FILE_PATH)) {
            const existingData = await fs.promises.readFile(config.SUMMARY_FILE_PATH, 'utf8');
            existingState = JSON.parse(existingData);
        }

        // Save main summary file
        await fs.promises.writeFile(
            config.SUMMARY_FILE_PATH,
            JSON.stringify(state, null, 2),
            'utf8'
        );

        // Only create and upload diff file if there are actual changes
        if (!existingState || 
            JSON.stringify(existingState.differences) !== JSON.stringify(state.differences)) {
            
            // Get new differences since last state
            const newDifferences = existingState 
                ? state.differences.filter(diff => 
                    !existingState.differences.some(
                        existingDiff => existingDiff.timestamp === diff.timestamp
                    )
                )
                : state.differences;

            if (newDifferences.length > 0) {
                await saveDiffFile(newDifferences);
            }
        } else {
            logger.info('No changes detected in summary differences, skipping diff file creation');
        }
    } catch (error) {
        logger.error('Error saving summary state:', error);
        throw error;
    }
};

