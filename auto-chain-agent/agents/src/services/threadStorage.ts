import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from '../logger';
import { HumanMessage, AIMessage, BaseMessage, SystemMessage } from '@langchain/core/messages';
import path from 'path';
import { ChatOpenAI } from "@langchain/openai";
import fs from 'fs';
import { MessageContent } from '@langchain/core/messages';

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

interface SummaryDifference {
    timestamp: string;
    threadId: string;
    previousSummary: string | MessageContent;
    currentSummary: string | MessageContent;
    difference: string | MessageContent;
}

interface SummaryState {
    lastCheck: string;
    differences: SummaryDifference[];
}

const SUMMARY_FILE_PATH = path.join(process.cwd(), 'summary-differences.json');
const CHECK_INTERVAL = 1 * 10 * 1000; // 1 minute


const initializeDb = async (dbPath: string) => {
    logger.info('Initializing SQLite database at:', dbPath);

    const db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Only create table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS threads (
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

export const loadThreadSummary = async () => {
    const summaryState = await loadSummaryState();
    
    // Group differences by threadId and sort by timestamp
    const threadSummaries = new Map<string, SummaryDifference>();
    
    // Sort differences by timestamp (newest first) before processing
    const sortedDifferences = [...summaryState.differences].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Take the first (most recent) difference for each threadId
    for (const diff of sortedDifferences) {
        if (!threadSummaries.has(diff.threadId)) {
            threadSummaries.set(diff.threadId, diff);
        }
    }
    
    const summaries = Array.from(threadSummaries.values())
        .map(diff => String(diff.currentSummary))
        .filter(summary => summary.trim().length > 0);

    logger.info(`Loaded ${summaries.length} thread summaries from differences`);
    return summaries;
};


const loadSummaryState = async (): Promise<SummaryState> => {
    try {
        if (fs.existsSync(SUMMARY_FILE_PATH)) {
            const data = await fs.promises.readFile(SUMMARY_FILE_PATH, 'utf8');
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

const saveSummaryState = async (state: SummaryState) => {
    try {
        await fs.promises.writeFile(
            SUMMARY_FILE_PATH,
            JSON.stringify(state, null, 2),
            'utf8'
        );
    } catch (error) {
        logger.error('Error saving summary state:', error);
        throw error;
    }
};

export const checkAndUpdateSummaries = async () => {
    logger.info('Checking for updates to summarize...');
    const threadStorage = createThreadStorage();
    const summaryState = await loadSummaryState();
    const lastCheckDate = new Date(summaryState.lastCheck);
    
    // Use the existing threadStorage connection instead of creating a new one
    const recentThreads = await threadStorage.getAllThreads().then(threads => 
        threads.filter(thread => 
            new Date(thread.updated_at) > lastCheckDate
        )
    );

    logger.info(`Found ${recentThreads.length} threads updated since last check`);

    if (recentThreads.length === 0) {
        return;
    }

    const model = new ChatOpenAI({
        modelName: "gpt-4-turbo-preview",
        temperature: 0.3
    });

    for (const thread of recentThreads) {
        const state = await threadStorage.loadThread(thread.thread_id);
        if (!state?.messages.length) continue;

        const lastMessages = state.messages.slice(-3);
        const currentContent = lastMessages
            .map(msg => `${msg._getType()}: ${String(msg.content)}`)
            .join('\n');

        // Find previous summary for this thread
        const previousSummary = summaryState.differences
            .filter(diff => diff.threadId === thread.thread_id)
            .pop()?.currentSummary || '';

        // Generate new summary
        const summaryResponse = await model.invoke([
            new SystemMessage({
                content: `Compare the previous summary with the current conversation and highlight only the new or changed information. Focus on:
                - New transactions or blockchain operations
                - User wallet address
                - User's wallets balances
                - User's friend/contact addresses
                - User's name
                - Changes in decisions or outcomes
                - New user interactions or requests
                
                Format as a brief diff summary.`
            }),
            new HumanMessage({
                content: `Previous summary: ${String(previousSummary)}\n\nCurrent conversation: ${currentContent}`
            })
        ]);

        const summaryContent = String(summaryResponse.content);
        
        // Skip storing if the summary indicates no changes
        const noChangeIndicators = [
            'no new',
            'no changes',
            'provides the same information',
            'reiterates the previous',
            'no additional'
        ];
        
        const hasNoChanges = noChangeIndicators.some(indicator => 
            summaryContent.toLowerCase().includes(indicator.toLowerCase())
        );
        logger.info('changes', hasNoChanges);
        if (!hasNoChanges) {
            summaryState.differences.push({
                timestamp: new Date().toISOString(),
                threadId: thread.thread_id,
                previousSummary: String(previousSummary),
                currentSummary: summaryContent,
                difference: summaryContent
            });
            logger.info(`Added new summary difference for thread ${thread.thread_id}`);
        } else {
            logger.info(`Skipped storing no-change summary for thread ${thread.thread_id}`);
        }
    }

    summaryState.lastCheck = new Date().toISOString();
    await saveSummaryState(summaryState);
    logger.info(`Updated summary differences for ${recentThreads.length} threads`);
};

export const initializeSummaries = async () => {
    logger.info('Initializing summary system...');
    
    // Check if summaries already exist
    const summaryExists = fs.existsSync(SUMMARY_FILE_PATH);
    if (summaryExists) {
        logger.info('Summary file already exists, skipping initialization');
        return;
    }

    // Create initial state
    const initialState: SummaryState = {
        lastCheck: new Date().toISOString(),
        differences: []
    };

    // Get all existing threads
    const threadStorage = createThreadStorage();
    const allThreads = await threadStorage.getAllThreads();
    
    logger.info(`Found ${allThreads.length} existing threads to summarize`);

    const model = new ChatOpenAI({
        modelName: "gpt-4-turbo-preview",
        temperature: 0.3
    });

    // Create initial summaries for all threads
    for (const thread of allThreads) {
        const state = await threadStorage.loadThread(thread.thread_id);
        if (!state?.messages.length) continue;

        const messages = state.messages;
        const currentContent = messages
            .map(msg => `${msg._getType()}: ${String(msg.content)}`)
            .join('\n');

        // Generate initial summary
        const summaryResponse = await model.invoke([
            new SystemMessage({
                content: `Provide a brief summary of this conversation. Focus on:
                - Key decisions or outcomes
                - Main user requests
                - Important actions taken`
            }),
            new HumanMessage({
                content: currentContent
            })
        ]);

        initialState.differences.push({
            timestamp: new Date().toISOString(),
            threadId: thread.thread_id,
            previousSummary: '',
            currentSummary: String(summaryResponse.content),
            difference: String(summaryResponse.content)
        });

        logger.info(`Created initial summary for thread ${thread.thread_id}`);
    }

    // Save initial state
    await saveSummaryState(initialState);
    logger.info('Summary system initialized successfully');
};

// Add this to your startup code:
export const startSummarySystem = async () => {
    await initializeSummaries();
    setInterval(checkAndUpdateSummaries, CHECK_INTERVAL);
    logger.info('Summary system started');
};

export type ThreadStorage = ReturnType<typeof createThreadStorage>;
