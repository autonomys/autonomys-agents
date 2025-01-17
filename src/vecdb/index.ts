import { VectorDB } from './VectorDB.js';

const memoryDB = new VectorDB('data/memory', 'my-index.bin', 'my-db.db', 100000);

export { memoryDB };
