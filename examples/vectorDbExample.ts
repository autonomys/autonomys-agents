import { getVectorDB, closeVectorDB } from '../src/services/vectorDb/vectorDBPool.js';

(async () => {
  try {
    // Get a VectorDB instance for the 'example' namespace from the pool
    const vectorDb = getVectorDB('example');
    console.log('VectorDB instance retrieved from pool.');

    // Insert test content with distinct markers
    console.log('Inserting test content...');

    // Record A: Recent sample record
    await vectorDb.insert('Recent sample content A');

    // Record B: Old sample record - we will update its timestamp
    await vectorDb.insert('Old sample content B');

    // Record C: Another recent sample record
    await vectorDb.insert('Recent sample content C');

    console.log('Test content inserted.');

    // Update the created_at timestamp for Record B to simulate an old record (2 hours ago)
    // We use the underlying database connection to execute a direct update
    const db = vectorDb.getDatabase();
    // This update targets the record containing 'Old sample content B'
    db.exec(
      "UPDATE content_store SET created_at = datetime('now', '-2 hours') WHERE content LIKE '%Old sample content B%'",
    );
    console.log('Updated Record B timestamp to 2 hours ago.');

    // Perform a plain vector search using a sample query that includes the word 'sample'
    console.log("Performing plain vector search for 'sample'...");
    const plainResults = await vectorDb.search({ query: 'sample', limit: 5 });
    console.log('Plain vector search results:', plainResults);

    // Perform a SQL filtered search
    // Filter: records created in the last 1 hour
    const sqlFilter = "created_at >= datetime('now', '-1 hour')";
    console.log(`Performing SQL filtered search for 'sample' with filter: ${sqlFilter}`);
    const filteredResults = await vectorDb.search({
      query: 'sample',
      sqlFilter,
      limit: 5,
    });
    console.log('SQL filtered search results:', filteredResults);

    // Example of content filtering
    const contentFilter = "content LIKE '%Recent%'";
    console.log(`Performing content filtered search for 'sample' with filter: ${contentFilter}`);
    const contentFilteredResults = await vectorDb.search({
      query: 'sample',
      sqlFilter: contentFilter,
      limit: 5,
    });
    console.log('Content filtered search results:', contentFilteredResults);

    // DIRECT SQL QUERY EXAMPLES
    console.log('\n--- DIRECT SQL QUERY EXAMPLES ---');

    // Example 1: Basic SELECT query to get all records
    console.log('Example 1: Basic SELECT query');
    const allRecords = await vectorDb.queryContent(
      'SELECT rowid, content, created_at FROM content_store',
    );
    console.log(`Retrieved ${allRecords.length} records`);

    // Example 2: Query with ORDER BY to get most recent records
    console.log('\nExample 2: Query with ORDER BY');
    const recentRecords = await vectorDb.queryContent(
      'SELECT rowid, content, created_at FROM content_store ORDER BY created_at DESC LIMIT 3',
    );
    console.log('Most recent records:');
    recentRecords.forEach((record, index) => {
      console.log(`${index + 1}. [${record.created_at}] ${record.content.substring(0, 50)}...`);
    });

    // CHUNKING EXAMPLE: Insert a large text that exceeds the token limit
    console.log('\n--- CHUNKING EXAMPLE ---');
    console.log('Inserting large text that will be automatically chunked...');

    // Generate a large text (approximately 50,000 characters)
    // This will exceed the 28,000 character limit and trigger chunking
    const generateLargeText = () => {
      const paragraph =
        'This is a sample paragraph that will be repeated multiple times to create a large text. ' +
        'It contains various words and phrases that can be used for searching later. ' +
        'Topics include artificial intelligence, machine learning, vector databases, and semantic search. ' +
        'We want to ensure this text is large enough to trigger the automatic chunking functionality. ';

      // Repeat the paragraph approximately 500 times to exceed the limit
      return Array(500).fill(paragraph).join(' ');
    };

    const largeText = generateLargeText();
    console.log(
      `Generated text of ${largeText.length} characters (exceeds the 28,000 character limit)`,
    );

    // Insert the large text - this will trigger automatic chunking
    await vectorDb.insert(largeText);
    console.log('Large text inserted with automatic chunking');

    // Search for terms within the chunked text
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

    // Example 5: Find and count chunks using queryContent
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

    // Example of combining multiple conditions in SQL filter
    const combinedFilter =
      "created_at >= datetime('now', '-3 hours') AND content LIKE '%intelligence%'";
    console.log(`\nPerforming combined filter search with filter: ${combinedFilter}`);
    const combinedResults = await vectorDb.search({
      query: 'artificial intelligence',
      sqlFilter: combinedFilter,
      limit: 3,
    });
    console.log('Combined filter search results:', combinedResults.length);

    // Close the vector database connection
    closeVectorDB('example');
    console.log('VectorDB connection closed.');
  } catch (err) {
    console.error('Error in vectorDbExample:', err);
  }
})();
