#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const examples: Record<string, string> = {
  'twitter': './twitterAgent/index.ts',
  'web3': './web3Agent/index.ts',
  'multi': './multiPersonality/index.ts',
  'notion': './notionAgent/index.ts',
  'slack': './slackAgent/index.ts',
  'github': './githubAgent/index.ts',
  'vectordb': './vectorDbExample.ts'
};

function listExamples() {
  console.log('Available examples:');
  Object.keys(examples).forEach(example => {
    console.log(`  - ${example}`);
  });
  console.log('\nUsage: yarn example <example-name> <character-name>');
}

async function main() {
  const exampleName = process.argv[2];
  
  if (!exampleName || exampleName === '--help' || exampleName === '-h') {
    listExamples();
    process.exit(0);
  }
  
  const examplePath = examples[exampleName];
  
  if (!examplePath) {
    console.error(`Error: Example '${exampleName}' not found.`);
    listExamples();
    process.exit(1);
  }
  
  const fullPath = join(__dirname, examplePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`Error: Example file '${fullPath}' does not exist.`);
    process.exit(1);
  }
  
  const args = process.argv.slice(3);
  const tsxProcess = spawn('tsx', [fullPath, ...args], { 
    stdio: 'inherit',
    shell: true
  });
  
  tsxProcess.on('close', (code) => {
    process.exit(code);
  });
}

main().catch(error => {
  console.error('Error running example:', error);
  process.exit(1);
}); 