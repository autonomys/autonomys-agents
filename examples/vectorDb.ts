import { VectorDB } from '../src/services/vectorDb/VectorDB.js';
import fs from 'fs';
import path from 'path';

// Initialize the vector database
const vectorDB = new VectorDB('data/twitter');

// Function to split text into chunks of roughly equal size
function splitIntoChunks(text: string, maxTokens: number = 6000): string[] {
  // Rough estimate: 1 token ≈ 4 characters
  const maxCharsPerChunk = maxTokens * 4;

  // Split into sentences (rough approximation)
  const sentences = text.split(/(?<=[.!?])\s+/);

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxCharsPerChunk) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Function to load memories from JSON files
async function loadMemories() {
  const memoriesDir = path.join(process.cwd(), 'examples', 'memories');
  const files = fs.readdirSync(memoriesDir);

  for (const file of files) {
    const filePath = path.join(memoriesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Split content into smaller chunks
    const chunks = splitIntoChunks(content);

    // Insert each chunk with a reference to the original file
    await Promise.all(
      chunks.map(async (chunk, index) => {
        console.log(`Inserting chunk ${index + 1}/${chunks.length} from ${file}`);
        await vectorDB.insert(chunk);
      }),
    );
  }

  console.log(`Processed ${files.length} memory files`);
}

const memories = await vectorDB.search('tweet', 1);
console.log(memories);

// // Load the memories
// loadMemories().catch(console.error);
