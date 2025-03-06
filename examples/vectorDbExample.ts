import { VectorDB } from '../src/services/vectorDb/VectorDB.js';

(async () => {
  try {
    // Create an instance of VectorDB for the 'example' namespace
    const vectorDb = new VectorDB('example');
    console.log('VectorDB instance created.');

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

    // Perform a metadata filtered search
    // Filter: records created in the last 1 hour
    const metadataFilter = "created_at >= datetime('now', '-1 hour')";
    console.log(`Performing metadata filtered search for 'sample' with filter: ${metadataFilter}`);
    const metadataResults = await vectorDb.search({
      query: 'sample',
      metadataFilter,
      limit: 5,
    });
    console.log('Metadata filtered search results:', metadataResults);

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

    // Close the vector database connection
    vectorDb.close();
    console.log('VectorDB connection closed.');
  } catch (err) {
    console.error('Error in vectorDbExample:', err);
  }
})();
