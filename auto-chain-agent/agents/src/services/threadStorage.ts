import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../logger';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import path from 'path';

export interface ThreadState {
    messages: BaseMessage[];
    toolCalls: Array<{
        id: string;
        type: string;
        function: {
            name: string;
            arguments: string;
        };
        result?: string;
    }>;
}

const initializeDb = async (dbPath: string) => {
    logger.info('Initializing SQLite database at:', dbPath);

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    await db.exec(`
        DROP TABLE IF EXISTS threads;
        CREATE TABLE threads (
            thread_id TEXT PRIMARY KEY,
            messages TEXT NOT NULL,
            tool_calls TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
};

const createMessage = (type: 'human' | 'ai', content: string) =>
    type === 'human' ? new HumanMessage({ content }) : new AIMessage({ content });

const serializeMessage = (msg: BaseMessage) => ({
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

export const createThreadStorage = () => {
    const dbPath = path.join(process.cwd(), 'thread-storage.sqlite');
    const dbPromise = initializeDb(dbPath);

    return {
        async saveThread(threadId: string, state: ThreadState) {
            const db = await dbPromise;
            await db.run(
                `INSERT OR REPLACE INTO threads (thread_id, messages, tool_calls, updated_at)
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
                [
                    threadId,
                    JSON.stringify(state.messages.map(serializeMessage)),
                    JSON.stringify(state.toolCalls)
                ]
            );

            logger.info(`Thread saved: ${threadId}`);
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

export type ThreadStorage = ReturnType<typeof createThreadStorage>;
