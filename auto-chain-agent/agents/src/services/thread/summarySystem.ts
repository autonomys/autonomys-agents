import { loadSummaryState, saveSummaryState } from './summaryState';
import { createThreadStorage } from './threadStorage';
import logger from '../../logger';
import fs from 'fs';
import path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { SummaryDifference, SummaryState } from './interface';
import { initializeDb } from './db';
import { config } from '../../config';



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


export const checkAndUpdateSummaries = async () => {
    logger.info('Checking for updates to summarize...');
    const threadStorage = createThreadStorage();
    const summaryState = await loadSummaryState();
    const lastCheckDate = new Date(summaryState.lastCheck);
    
    // Get only the most recent thread modified since last check
    const modifiedThreads = await threadStorage.getAllThreads().then(threads => 
        threads
            .filter(thread => new Date(thread.updated_at) > lastCheckDate)
            .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
            .slice(0, 1) 
    );

    if (modifiedThreads.length === 0) {
        logger.info('No thread modifications found since last check');
        summaryState.lastCheck = new Date().toISOString();
        await saveSummaryState(summaryState);
        return;
    }

    logger.info(`Found ${modifiedThreads.length} modified threads since last check`);

    const model = new ChatOpenAI({
        modelName: config.LLM_MODEL,
        temperature: config.TEMPERATURE
    });

    for (const thread of modifiedThreads) {
        logger.info(`Checking thread ${thread.thread_id}`);
        const state = await threadStorage.loadThread(thread.thread_id);
        if (!state?.messages.length) continue;

        const lastMessages = state.messages.slice(-5);
        const currentContent = lastMessages
            .map(msg => `${msg._getType()}: ${String(msg.content)}`)
            .join('\n');

        // Find previous summary for this thread
        const previousSummary = summaryState.differences
            .filter(diff => diff.threadId === thread.thread_id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .shift()?.currentSummary || '';

        // Generate new summary
        const summaryResponse = await model.invoke([
            new SystemMessage({
                content: `IMPORTANT CHANGES:
                - New transactions or blockchain operations like checking balances or performing transactions
                - Remember user wallet address
                - Changes in wallet addresses or balances
                - New user interactions or requests
                - Changes in decisions or outcomes
                Compare the previous summary (IF THERE IS ANY) with the current conversation and highlight only the new or changed information. 
                Summarize the important information if it is the initial summary like user's wallet address, name and etc.
                If there are no meaningful changes, explicitly state "NO_CHANGES".
                DON'T ADD MNEMONICS IN THE SUMMARY AT ALL.
                Format as a brief diff summary.
                Provide your reasoning for the summary.
                `
            }),
            new HumanMessage({
                content: `Previous summary: ${String(previousSummary)}\n\nCurrent conversation: ${currentContent}`
            })
        ]);
        logger.info(`Summary response: ${summaryResponse.content}`);
        const summaryContent = String(summaryResponse.content);

        const hasNoChanges = 
            summaryContent.includes('NO_CHANGES') ||
            (typeof summaryContent === 'string' && typeof previousSummary === 'string' && summaryContent.trim() === previousSummary.trim()) ||
            (typeof summaryContent === 'string' && summaryContent.toLowerCase().includes('no new')) ||
            (typeof summaryContent === 'string' && summaryContent.toLowerCase().includes('no changes')) ||
            summaryContent.toLowerCase().includes('same as before');

        if (!hasNoChanges) {
            logger.info(`Adding new summary for thread ${thread.thread_id} - Found changes`);
            summaryState.differences.push({
                timestamp: new Date().toISOString(),
                threadId: thread.thread_id,
                previousSummary: String(previousSummary),
                currentSummary: summaryContent,
                difference: summaryContent,
                previousCID: undefined
            });
        } else {
            logger.info(`Skipping summary for thread ${thread.thread_id} - No meaningful changes`);
        }
    }

    summaryState.lastCheck = new Date().toISOString();
    await saveSummaryState(summaryState);
};


export const initializeSummaries = async () => {
    logger.info('Initializing summary system...');
    
    // Check if summaries already exist
    const summaryExists = fs.existsSync(config.SUMMARY_FILE_PATH);
    if (summaryExists) {
        logger.info('Summary file already exists, skipping initialization');
        return;
    }

    const initialState: SummaryState = {
        lastCheck: new Date().toISOString(),
        differences: []
    };

    // Get all existing threads
    const threadStorage = createThreadStorage();
    const allThreads = await threadStorage.getAllThreads();
    
    logger.info(`Found ${allThreads.length} existing threads to summarize`);

    const model = new ChatOpenAI({
        modelName: config.LLM_MODEL,
        temperature: config.TEMPERATURE
    });

    // Create initial summaries for all threads
    for (const thread of allThreads) {
        const state = await threadStorage.loadThread(thread.thread_id);
        if (!state?.messages.length) continue;

        const messages = state.messages;
        const currentContent = messages
            .map(msg => `${msg._getType()}: ${String(msg.content)}`)
            .join('\n');

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
            difference: String(summaryResponse.content),
            previousCID: undefined
        });

        logger.info(`Created initial summary for thread ${thread.thread_id}`);
    }

    await saveSummaryState(initialState);
    logger.info('Summary system initialized successfully');
};


export const startSummarySystem = async () => {
    await initializeSummaries();
    setInterval(checkAndUpdateSummaries, config.CHECK_INTERVAL);
    logger.info('Summary system started');
};

export const getSummaryUploads = async () => {
    const db = await initializeDb(path.join(process.cwd(), 'thread-storage.sqlite'));
    return db.all(
        'SELECT * FROM summary_uploads ORDER BY timestamp DESC'
    );
};


