
import path from 'path';
import fs from 'fs';
import logger from '../../logger';
import { initializeDb } from './db';
import { ThreadState } from './interface';
import { serializeMessage, deserializeMessage } from './utils';



export const createThreadStorage = () => {
    // Initialize if database doesn't exist
    const dbPath = path.join(process.cwd(), 'thread-storage.sqlite');
    const dbExists = fs.existsSync(dbPath);
    
    if (!dbExists) {
        logger.info('Database file not found, creating new database');
    }
    
    const dbPromise = initializeDb(dbPath);

    return {
        async saveThread(threadId: string, state: ThreadState) {
            try {
                const db = await dbPromise;
                const threadData = {
                    threadId,
                    messageCount: state.messages.length,
                    toolCallCount: state.toolCalls.length
                };
                logger.info(`Preparing to save thread data: ${JSON.stringify(threadData)}`);

                const serializedMessages = JSON.stringify(state.messages.map(serializeMessage));
                const serializedToolCalls = JSON.stringify(state.toolCalls);
                
                const serializedInfo = {
                    messagesLength: serializedMessages.length,
                    toolCallsLength: serializedToolCalls.length
                };
                logger.info(`Serialized data: ${JSON.stringify(serializedInfo)}`);

                const result = await db.run(
                    `INSERT OR REPLACE INTO threads (thread_id, messages, tool_calls, updated_at)
                     VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                    [
                        threadId,
                        serializedMessages,
                        serializedToolCalls
                    ]
                );

                logger.info(`Database operation result: ${JSON.stringify(result)}`);

                // Verify the save immediately
                const verification = await db.get(
                    'SELECT thread_id, length(messages) as msg_len FROM threads WHERE thread_id = ?',
                    threadId
                );
                
                logger.info(`Verification result: ${JSON.stringify(verification)}`);

                if (!verification) {
                    throw new Error('Failed to verify saved data');
                }
            } catch (error) {
                logger.error('Error in saveThread:', error);
                logger.error('Full error details:', {
                    name: (error as Error).name,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined
                });
                throw error;
            }
        },

        async loadThread(threadId: string): Promise<ThreadState | null> {
            const db = await dbPromise;
            const row = await db.get(
                'SELECT messages, tool_calls FROM threads WHERE thread_id = ?',
                threadId
            );

            if (!row) {
                logger.warn(`Thread not found: ${threadId}`);
                return null;
            }

            return {
                messages: JSON.parse(row.messages).map(deserializeMessage),
                toolCalls: JSON.parse(row.tool_calls || '[]')
            };
        },

        async getAllThreads() {
            const db = await dbPromise;
            return db.all(
                'SELECT thread_id, created_at, updated_at FROM threads ORDER BY updated_at DESC'
            );
        },

        async deleteThread(threadId: string) {
            const db = await dbPromise;
            await db.run('DELETE FROM threads WHERE thread_id = ?', threadId);
            logger.info(`Thread deleted: ${threadId}`);
        },

        async cleanup(olderThanDays = 30) {
            const db = await dbPromise;
            const result = await db.run(
                'DELETE FROM threads WHERE updated_at < datetime("now", ?)',
                [`-${olderThanDays} days`]
            );
            const deletedCount = result.changes || 0;
            logger.info(`Cleaned up ${deletedCount} old threads`);
            return deletedCount;
        }
    };
};
