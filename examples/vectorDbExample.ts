import { getVectorDB, closeVectorDB } from '@autonomys/agent-core/src/services/vectorDb/vectorDBPool.js';
import { parseArgs } from '@autonomys/agent-core/src/utils/args.js';
import { getConfig } from '@autonomys/agent-core/src/config/index.js';

// First, parse any command line arguments
parseArgs();

// Load configuration from environment variables or config files
// This contains all the settings our agent needs to operate
const configInstance = await getConfig();
if (!configInstance) {
  throw new Error('Config instance not found');
}

// Extract the configuration and character name from the config instance
const { config } = configInstance;
const character = config.characterConfig;
// This example demonstrates how to use the vector database capabilities
// We'll create sample data, run different types of searches, and show various filtering techniques
(async () => {
  try {
    // Get a VectorDB instance for the 'example' namespace from the pool
    const vectorDb = getVectorDB('example', character.characterPath);
    console.log('VectorDB instance retrieved from pool.');

    // Let's create some test data to work with
    // We'll insert different records with varying content and timestamps
    console.log('Inserting test content...');

    // Record A: Recent sample record
    await vectorDb.insert('Recent sample content A');

    // Record B: Old sample record - we will update its timestamp
    await vectorDb.insert('Old sample content B');

    // Record C: Another recent sample record
    await vectorDb.insert('Recent sample content C');

    console.log('Test content inserted.');

    // Now, let's manipulate the timestamp of Record B to simulate an older entry
    // This will let us demonstrate time-based filtering later
    const db = vectorDb.getDatabase();
    // This direct database update changes the created_at timestamp to 2 hours ago
    db.exec(
      "UPDATE content_store SET created_at = datetime('now', '-2 hours') WHERE content LIKE '%Old sample content B%'",
    );
    console.log('Updated Record B timestamp to 2 hours ago.');

    // Let's perform a basic vector search
    // This search finds semantically similar content to the word "sample"
    console.log("Performing plain vector search for 'sample'...");
    const plainResults = await vectorDb.search({ query: 'sample', limit: 5 });
    console.log('Plain vector search results:', plainResults);

    // Now we'll demonstrate a time-filtered search
    // This will only return records created within the last hour
    const sqlFilter = "created_at >= datetime('now', '-1 hour')";
    console.log(`Performing SQL filtered search for 'sample' with filter: ${sqlFilter}`);
    const filteredResults = await vectorDb.search({
      query: 'sample',
      sqlFilter,
      limit: 5,
    });
    console.log('SQL filtered search results:', filteredResults);

    // We can also filter based on the content itself
    // This search will only return records containing the word "Recent"
    const contentFilter = "content LIKE '%Recent%'";
    console.log(`Performing content filtered search for 'sample' with filter: ${contentFilter}`);
    const contentFilteredResults = await vectorDb.search({
      query: 'sample',
      sqlFilter: contentFilter,
      limit: 5,
    });
    console.log('Content filtered search results:', contentFilteredResults);

    // Beyond vector searches, we can run direct SQL queries on the database
    console.log('\n--- DIRECT SQL QUERY EXAMPLES ---');

    // First, let's get all records with a simple SELECT query
    console.log('Example 1: Basic SELECT query');
    const allRecords = await vectorDb.queryContent(
      'SELECT rowid, content, created_at FROM content_store',
    );
    console.log(`Retrieved ${allRecords.length} records`);

    // We can also sort the results by timestamp to get the most recent entries
    console.log('\nExample 2: Query with ORDER BY');
    const recentRecords = await vectorDb.queryContent(
      'SELECT rowid, content, created_at FROM content_store ORDER BY created_at DESC LIMIT 3',
    );
    console.log('Most recent records:');
    recentRecords.forEach((record, index) => {
      console.log(`${index + 1}. [${record.created_at}] ${record.content.substring(0, 50)}...`);
    });

    // Next, let's demonstrate the automatic chunking feature
    // This is useful when dealing with large text documents
    console.log('\n--- CHUNKING EXAMPLE ---');
    console.log('Inserting large text that will be automatically chunked...');

    // Create a large text that exceeds the token limit
    // The system will automatically break it into manageable chunks
    const generateLargeText = () => {
      const paragraph =
        'This is a sample paragraph that will be repeated multiple times to create a large text. ' +
        'It contains various words and phrases that can be used for searching later. ' +
        'Topics include artificial intelligence, machine learning, vector databases, and semantic search. ' +
        'We want to ensure this text is large enough to trigger the automatic chunking functionality. ';

      // Repeat the paragraph many times to create a very large document
      return Array(500).fill(paragraph).join(' ');
    };

    const largeText = generateLargeText();
    console.log(
      `Generated text of ${largeText.length} characters (exceeds the 28,000 character limit)`,
    );

    // Insert the large text - the system will automatically split it into chunks
    await vectorDb.insert(largeText);
    console.log('Large text inserted with automatic chunking');

    // Now let's search within the chunked text
    // We can find specific content even when it's split across multiple chunks
    console.log('\nSearching within the chunked text...');
    const chunkSearchResults = await vectorDb.search({
      query: 'artificial intelligence vector database',
      limit: 3,
    });

    console.log('Chunk search results:');
    chunkSearchResults.forEach((result, index) => {
      // Display a preview of the content (first 100 characters)
      const contentPreview = result.content.substring(0, 100) + '...';
      console.log(
        `Result ${index + 1}: [Distance: ${result.distance.toFixed(4)}] ${contentPreview}`,
      );
    });

    // We can also examine the chunks directly using a SQL query
    console.log('\nExample 5: Finding chunks using queryContent');
    const chunkQuery = await vectorDb.queryContent(`
      SELECT rowid, content, created_at 
      FROM content_store 
      WHERE content LIKE '[Chunk %]%'
      ORDER BY rowid
    `);
    console.log(`Found ${chunkQuery.length} chunks from the large text insertion`);
    if (chunkQuery.length > 0) {
      // Show the first chunk
      console.log('First chunk preview:', chunkQuery[0].content.substring(0, 100) + '...');
    }

    // Finally, we'll demonstrate combining multiple filters in a single query
    // This search finds entries about "artificial intelligence" created in the last 3 hours
    const combinedFilter =
      "created_at >= datetime('now', '-3 hours') AND content LIKE '%intelligence%'";
    console.log(`\nPerforming combined filter search with filter: ${combinedFilter}`);
    const combinedResults = await vectorDb.search({
      query: 'artificial intelligence',
      sqlFilter: combinedFilter,
      limit: 3,
    });
    console.log('Combined filter search results:', combinedResults.length);

    // Always close the connection when finished to free up resources
    closeVectorDB('example');
    console.log('VectorDB connection closed.');
  } catch (err) {
    console.error('Error in vectorDbExample:', err);
  }
})();
