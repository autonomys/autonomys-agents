import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../logger';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import path from 'path';
import { ThreadState } from '../types';

const initializeDb = async (dbPath: string) => {
    logger.info('Initializing SQLite database at:', dbPath);

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Drop existing table and create new one
    await db.exec(`
        DROP TABLE IF EXISTS threads;
        CREATE TABLE threads (
            thread_id TEXT PRIMARY KEY,
            state TEXT NOT NULL,
            last_output TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
};

const createMessage = (type: 'human' | 'ai', content: string) =>
    type === 'human' ? new HumanMessage({ content }) : new AIMessage({ content });

const serializeMessage = (msg: any) => ({
    _type: msg._getType(),
    content: msg.content,
    additional_kwargs: msg.additional_kwargs
});

const deserializeMessage = (msg: any) => {
    if (!msg) return createMessage('ai', 'Invalid message');
    return createMessage(
        msg._type === 'human' ? 'human' : 'ai',
        msg.content
    );
};

const parseThreadState = (row: any): ThreadState | null => {
    const parsedState = JSON.parse(row.state);
    const lastOutput = row.last_output ? JSON.parse(row.last_output) : undefined;

    return {
        state: {
            messages: parsedState.messages.map(deserializeMessage),
            toolCalls: parsedState.toolCalls ?? [],
            toolResults: parsedState.toolResults ?? []
        },
        lastOutput
    };
};

export const createThreadStorage = () => {
    const dbPath = path.join(process.cwd(), 'thread-storage.sqlite');
    const dbPromise = initializeDb(dbPath);

    return {
        async saveThread(threadId: string, state: ThreadState) {
            const db = await dbPromise;
            const stateToSave = {
                ...state.state,
                messages: state.state.messages.map(serializeMessage)
            };

            await db.run(
                `INSERT OR REPLACE INTO threads (thread_id, state, last_output, updated_at)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    threadId,
                    JSON.stringify(stateToSave),
                    state.lastOutput ? JSON.stringify(state.lastOutput) : null
                ]
            );

            logger.info(`Thread saved: ${threadId}`, {
                messageCount: state.state.messages.length
            });
        },

        async loadThread(threadId: string): Promise<ThreadState | null> {
            const db = await dbPromise;
            const row = await db.get(
                'SELECT state, last_output FROM threads WHERE thread_id = ?',
                threadId
            );

            if (!row) {
                logger.warn(`Thread not found: ${threadId}`);
                return null;
            }

            return parseThreadState(row);
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

export type ThreadStorage = ReturnType<typeof createThreadStorage>;
