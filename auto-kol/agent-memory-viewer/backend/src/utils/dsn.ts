
import { createAutoDriveApi, downloadObject } from '@autonomys/auto-drive';
import { config } from '../config/index.js';
import { inflate } from 'pako';

export async function downloadMemory(cid: string) {
    try {
        const api = createAutoDriveApi({ 
            apiKey: config.DSN_API_KEY || '' 
        });
        
        const stream = await downloadObject(api, { cid: cid });
        const reader = stream.getReader();
        const chunks: Uint8Array[] = [];
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }

        const allChunks = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let position = 0;
        for (const chunk of chunks) {
            allChunks.set(chunk, position);
            position += chunk.length;
        }

        const decompressed = inflate(allChunks);
        const jsonString = new TextDecoder().decode(decompressed);
        const memoryData = JSON.parse(jsonString);
        return memoryData;
    } catch (error) {
        console.error('Error downloading memory:', error);
    }

}