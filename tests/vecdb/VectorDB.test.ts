import { VectorDB } from '../../src/services/vectorDb/VectorDB';
import { join } from 'path';
import { rmSync, existsSync } from 'fs';

jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
}));

describe('VectorDB', () => {
  let vectorDB: VectorDB;
  const testDir = join(process.cwd(), 'data', 'test-vector-db');

  beforeEach(() => {
    vectorDB = new VectorDB('data/test-vector-db', 'test-index.bin', 'test-store.db', 1000);
  });

  afterEach(() => {
    if (vectorDB?.getDatabase()) {
      vectorDB.getDatabase().close();
    }

    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('insert', () => {
    it('should successfully insert content', async () => {
      const content = 'The quick brown fox jumps over the lazy dog';
      const result = await vectorDB.insert(content);
      expect(result).toBe(true);
    });

    it('should handle multiple inserts', async () => {
      const contents = [
        'The quick brown fox jumps over the lazy dog',
        'Machine learning is a subset of artificial intelligence',
        'Natural language processing is fascinating',
      ];

      for (const content of contents) {
        const result = await vectorDB.insert(content);
        expect(result).toBe(true);
      }
    });

    it('should handle empty content gracefully', async () => {
      await expect(vectorDB.insert('')).rejects.toThrow();
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await vectorDB.insert('The quick brown fox jumps over the lazy dog');
      await vectorDB.insert('Machine learning is a subset of artificial intelligence');
      await vectorDB.insert('Natural language processing and AI are related fields');
    });

    it('should return relevant results for AI-related query', async () => {
      const results = await vectorDB.search('What is artificial intelligence?', 2);

      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('content');
      expect(results[0]).toHaveProperty('distance');
      expect(results[0]).toHaveProperty('rowid');

      // The AI-related content should be closer (smaller distance) than unrelated content
      const aiContent = results.find(r =>
        r.content.toLowerCase().includes('artificial intelligence'),
      );
      expect(aiContent).toBeDefined();
    });

    it('should respect the limit parameter', async () => {
      const limit = 1;
      const results = await vectorDB.search('AI and ML', limit);
      expect(results).toHaveLength(limit);
    });

    it('should handle empty query gracefully', async () => {
      await expect(vectorDB.search('')).rejects.toThrow();
    });
  });

  describe('maxElements behavior', () => {
    it('should handle reaching maxElements limit', async () => {
      const smallDB = new VectorDB(
        'data/test-vector-db',
        'small-test-index.bin',
        'small-test-store.db',
        2, // Very small max elements for testing
      );

      try {
        // Insert more than maxElements
        await smallDB.insert('First entry');
        await smallDB.insert('Second entry');
        await smallDB.insert('Third entry'); // Should replace oldest entry

        const results = await smallDB.search('First entry', 3);
        expect(results.some(r => r.content === 'First entry')).toBe(false);
      } finally {
        smallDB.getDatabase().close();
      }
    });
  });
});
