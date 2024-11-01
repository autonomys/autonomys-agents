import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { ThreadState } from '../types';
import logger from '../logger';
import { AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';
import path from 'path';

// Types
type MessageType = {
    _type?: string;
    content: string;
    kwargs?: { content: string };
    id?: string[];
};

type DbRow = {
    state: string;
    last_output: string | null;
};

// Pure functions for message handling
const createMessage = (type: 'human' | 'ai', content: string): BaseMessage =>
    type === 'human' ? new HumanMessage({ content }) : new AIMessage({ content });

const deserializeMessage = (msg: MessageType): BaseMessage => {
    if (!msg) return createMessage('ai', 'Invalid message');

    // Handle LangChain format
    if (msg.kwargs?.content) {
        return createMessage(
            msg.id?.includes('HumanMessage') ? 'human' : 'ai',
            msg.kwargs.content
        );
    }

    // Handle simplified format
    return createMessage(
        msg._type === 'human' ? 'human' : 'ai',
        msg.content
    );
};

const serializeMessage = (msg: BaseMessage) => ({
    _type: msg._getType(),
    content: msg.content,
    additional_kwargs: msg.additional_kwargs
});

// Database operations
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

    return db;
};

// Thread state operations
const parseThreadState = (row: DbRow): ThreadState | null => {
    const parsedState = JSON.parse(row.state);
    const lastOutput = row.last_output ? JSON.parse(row.last_output) : undefined;

    if (!Array.isArray(parsedState.messages)) {
        logger.warn('Invalid state: messages is not an array');
        return null;
    }

    return {
        state: {
            messages: parsedState.messages.map(deserializeMessage),
            toolCalls: parsedState.toolCalls ?? [],
            toolResults: parsedState.toolResults ?? []
        },
        lastOutput
    };
};

// Main storage factory
export const createThreadStorage = () => {
    const dbPath = path.join(process.cwd(), 'thread-storage.sqlite');
    const dbPromise = initializeDb(dbPath);

    const ensureConnection = async () => {
        const db = await dbPromise;
        if (!db) throw new Error('Database connection not established');
        return db;
    };

    return {
        async saveThread(threadId: string, state: ThreadState): Promise<void> {
            const db = await ensureConnection();

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
            const db = await ensureConnection();

            const row = await db.get<DbRow>(
                'SELECT state, last_output FROM threads WHERE thread_id = ?',
                threadId
            );

            if (!row) {
                logger.warn(`Thread not found: ${threadId}`);
                return null;
            }

            return parseThreadState(row);
        },

        async getAllThreads(): Promise<Array<{ threadId: string; createdAt: string; updatedAt: string }>> {
            const db = await ensureConnection();

            return db.all(
                'SELECT thread_id, created_at, updated_at FROM threads ORDER BY updated_at DESC'
            );
        },

        async deleteThread(threadId: string): Promise<void> {
            const db = await ensureConnection();
            await db.run('DELETE FROM threads WHERE thread_id = ?', threadId);
            logger.info(`Thread deleted: ${threadId}`);
        },

        async cleanup(olderThanDays: number = 30): Promise<number> {
            const db = await ensureConnection();

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
