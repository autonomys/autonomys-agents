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
    db.exec("UPDATE content_store SET created_at = datetime('now', '-2 hours') WHERE content LIKE '%Old sample content B%'");
    console.log('Updated Record B timestamp to 2 hours ago.');

    // Perform a plain vector search using a sample query that includes the word 'sample'
    console.log("Performing plain vector search for 'sample'...");
    const plainResults = await vectorDb.search('sample', 5);
    console.log('Plain vector search results:', plainResults);

    // Perform a metadata filtered search
    // Filter: records created in the last 1 hour
    const metadataFilter = "created_at >= datetime('now', '-1 hour')";
    console.log(`Performing metadata filtered search for 'sample' with filter: ${metadataFilter}`);
    const metadataResults = await vectorDb.searchWithMetadata('sample', metadataFilter, 5);
    console.log('Metadata filtered search results:', metadataResults);

    // Close the vector database connection
    vectorDb.close();
    console.log('VectorDB connection closed.');
  } catch (err) {
    console.error('Error in vectorDbExample:', err);
  }
})(); 