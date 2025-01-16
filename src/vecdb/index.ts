import Database from "better-sqlite3";
import vectorlite from "vectorlite";
import fs from "fs";

const extensionPath = vectorlite.vectorlitePath();
console.log("Vectorlite extension path:", extensionPath);

const memoryDb = new Database(":memory:");

memoryDb.loadExtension(extensionPath);
console.log("Vectorlite loaded successfully!");

memoryDb.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS my_table USING vectorlite(
        my_embedding float32[3], 
        hnsw(max_elements=100)
    )
`);

const diskDbPath = "mydatabase.db";

const diskDbExists = fs.existsSync(diskDbPath);

if (diskDbExists) {
    console.log("Loading database from disk...");
    const diskDb = new Database(diskDbPath, { readonly: true });
    const backup = memoryDb.backup(diskDbPath);
    await backup;
    console.log("Database loaded into memory.");
} else {
    console.log("No existing disk database found. Starting fresh.");
}

const insertStmt = memoryDb.prepare(`
    INSERT INTO my_table (rowid, my_embedding) 
    VALUES (?, ?)
`);

insertStmt.run(1, Buffer.from(new Float32Array([1, 2, 3]).buffer));
insertStmt.run(2, Buffer.from(new Float32Array([4, 5, 6]).buffer));
insertStmt.run(3, Buffer.from(new Float32Array([7, 8, 9]).buffer));

console.log("Vectors inserted into memory!");

const queryStmt = memoryDb.prepare(`
    SELECT rowid, distance 
    FROM my_table 
    WHERE knn_search(my_embedding, knn_param(?, 2))
`);

const queryResult = queryStmt.all(Buffer.from(new Float32Array([3, 4, 5]).buffer));

console.log("Nearest neighbors:", queryResult);

console.log("Saving database to disk...");
const diskDb = new Database(diskDbPath);
const backup = memoryDb.backup(diskDbPath);
await backup;
console.log("Database saved to disk.");

memoryDb.close();
diskDb.close();
console.log("Databases closed.");
