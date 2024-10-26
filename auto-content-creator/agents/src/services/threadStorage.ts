import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { ThreadState } from '../types';
import logger from '../logger';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import path from 'path';

// Database initialization
const initializeDb = async (dbPath: string): Promise<Database> => {
    logger.info('Initializing SQLite database at:', dbPath);
    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS threads (
            thread_id TEXT PRIMARY KEY,
            state TEXT NOT NULL,
            last_output TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    logger.info('Thread storage initialized with SQLite');
    return db;
};

// Message deserialization
const deserializeMessage = (msg: any) => {
    try {
        // Handle LangChain serialized format
        if (msg.kwargs) {
            const content = msg.kwargs.content;
            return msg.id.includes('HumanMessage')
                ? new HumanMessage({ content })
                : new AIMessage({ content });
        }

        // Handle our simplified format
        if (msg._type === 'human') {
            return new HumanMessage({ content: msg.content });
        }
        return new AIMessage({ content: msg.content });
    } catch (error) {
        logger.error('Error deserializing message:', error);
        return new AIMessage({ content: 'Error deserializing message' });
    }
};

// Thread storage operations
export const createThreadStorage = () => {
    const dbPath = path.join(process.cwd(), 'thread-storage.sqlite');
    let dbPromise = initializeDb(dbPath);

    const ensureConnection = async (): Promise<Database> => {
        const db = await dbPromise;
        if (!db) {
            throw new Error('Database connection not established');
        }
        return db;
    };

    const saveThread = async (threadId: string, state: ThreadState): Promise<void> => {
        try {
            const db = await ensureConnection();
            logger.info(`Saving thread state for ${threadId}`, {
                messageCount: state.state.messages?.length ?? 0,
                hasLastOutput: !!state.lastOutput
            });

            // Ensure state has all required properties
            const stateToSave = {
                messages: state.state.messages ?? [],
                reflectionScore: state.state.reflectionScore ?? 0,
                researchPerformed: state.state.researchPerformed ?? false,
                research: state.state.research ?? '',
                reflections: state.state.reflections ?? [],
                drafts: state.state.drafts ?? [],
                feedbackHistory: state.state.feedbackHistory ?? [],
            };

            const serializedState = JSON.stringify(stateToSave, (key, value) => {
                if (value instanceof HumanMessage || value instanceof AIMessage) {
                    return {
                        _type: value._getType(),
                        content: value.content,
                        additional_kwargs: value.additional_kwargs
                    };
                }
                return value;
            });

            const serializedLastOutput = state.lastOutput ? JSON.stringify(state.lastOutput) : null;

            await db.run(
                `INSERT OR REPLACE INTO threads (thread_id, state, last_output, updated_at)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [threadId, serializedState, serializedLastOutput]
            );

            logger.info(`Thread state saved successfully: ${threadId}`);
        } catch (error) {
            logger.error(`Error saving thread ${threadId}:`, error);
            throw error;
        }
    };

    const loadThread = async (threadId: string): Promise<ThreadState | null> => {
        try {
            const db = await ensureConnection();
            logger.info(`Loading thread state for ${threadId}`);

            const row = await db.get(
                'SELECT state, last_output FROM threads WHERE thread_id = ?',
                threadId
            );

            if (!row) {
                logger.warn(`Thread ${threadId} not found`);
                return null;
            }

            const parsedState = JSON.parse(row.state);
            const lastOutput = row.last_output ? JSON.parse(row.last_output) : undefined;

            // Ensure messages array exists
            if (!parsedState.messages) {
                logger.warn(`Invalid state structure for thread ${threadId}: missing messages array`);
                return null;
            }

            // Force messages into array if not already
            const messageArray = Array.isArray(parsedState.messages)
                ? parsedState.messages
                : [parsedState.messages];

            // Reconstruct message instances with improved error handling
            const messages = messageArray.map((msg: any) => {
                try {
                    if (!msg) {
                        logger.warn('Null or undefined message found');
                        return new AIMessage({ content: 'Invalid message' });
                    }
                    return deserializeMessage(msg);
                } catch (error) {
                    logger.error('Error deserializing message:', { error, msg });
                    return new AIMessage({ content: 'Error deserializing message' });
                }
            });

            // Ensure all required state properties exist
            const state = {
                messages,
                reflectionScore: parsedState.reflectionScore ?? 0,
                researchPerformed: parsedState.researchPerformed ?? false,
                research: parsedState.research ?? '',
                reflections: parsedState.reflections ?? [],
                drafts: parsedState.drafts ?? [],
                feedbackHistory: parsedState.feedbackHistory ?? [],
            };

            logger.info(`Thread state loaded successfully: ${threadId}`, {
                messageCount: messages.length,
                hasLastOutput: !!lastOutput
            });

            return { state, lastOutput };
        } catch (error) {
            logger.error(`Error loading thread ${threadId}:`, error);
            throw error;
        }
    };

    const getAllThreads = async (): Promise<Array<{ threadId: string; createdAt: string; updatedAt: string }>> => {
        try {
            const db = await ensureConnection();
            const rows = await db.all(
                'SELECT thread_id, created_at, updated_at FROM threads ORDER BY updated_at DESC'
            );

            return rows.map(row => ({
                threadId: row.thread_id,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        } catch (error) {
            logger.error('Error listing threads:', error);
            throw error;
        }
    };

    const deleteThread = async (threadId: string): Promise<void> => {
        try {
            const db = await ensureConnection();
            await db.run('DELETE FROM threads WHERE thread_id = ?', threadId);
            logger.info(`Thread deleted: ${threadId}`);
        } catch (error) {
            logger.error(`Error deleting thread ${threadId}:`, error);
            throw error;
        }
    };

    const cleanup = async (olderThanDays: number = 30): Promise<number> => {
        try {
            const db = await ensureConnection();
            const result = await db.run(
                'DELETE FROM threads WHERE updated_at < datetime("now", ?)',
                [`-${olderThanDays} days`]
            );

            const deletedCount = result.changes || 0;
            logger.info(`Cleaned up ${deletedCount} old threads`);
            return deletedCount;
        } catch (error) {
            logger.error('Error during cleanup:', error);
            throw error;
        }
    };

    return {
        saveThread,
        loadThread,
        getAllThreads,
        deleteThread,
        cleanup
    };
};

export type ThreadStorage = ReturnType<typeof createThreadStorage>;
