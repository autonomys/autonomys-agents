import { vectorDB } from './index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('vecdb-test');

async function runTests() {
    try {
        // Test 1: Insert some sample documents
        logger.info('Test 1: Inserting sample documents...');
        await vectorDB.insert(
            "The quick brown fox jumps over the lazy dog",
            { type: "sample", category: "pangram" }
        );
        await vectorDB.insert(
            "Machine learning is a subset of artificial intelligence",
            { type: "sample", category: "technology" }
        );
        // Test 2: Search for similar documents
        logger.info('Test 2: Searching for AI-related content...');
        const results = await vectorDB.search("What is artificial intelligence and llm?", 3);
        logger.info('Search results:', {
            query: "What is artificial intelligence?",
            results: results
        });

        // Test 3: Search for unrelated content
        logger.info('Test 3: Searching for unrelated content...');
        const unrelatedResults = await vectorDB.search("Recipe for chocolate cake", 2);
        logger.info('Unrelated search results:', {
            query: "Recipe for chocolate cake",
            results: unrelatedResults
        });

    } catch (error) {
        logger.error('Test failed:', error);
    } finally {
        // Clean up
        vectorDB.getDatabase().close();
    }
}

// Run the tests
runTests().then(() => {
    logger.info('Tests completed');
}); 