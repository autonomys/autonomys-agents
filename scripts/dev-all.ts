import { spawn } from 'child_process';
import { closeAllVectorDBs } from '../core/src/services/vectorDb/vectorDBPool';
import { rootDir } from './utils';

// Simply pass any arguments to the agent process
const characterArg = process.argv.slice(2).join(' ');

console.log(`Starting agent${characterArg ? ` with '${characterArg}'` : ''} and web-cli`);

const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
};

const prefixOutput = (prefix: string, color: string, data: Buffer) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      process.stdout.write(`${color}[${prefix}]${colors.reset} ${line}\n`);
    }
  }
}

// Run the agent
const agentProcess = spawn('yarn', ['workspace', 'autonomys-agents-core', 'dev', ...(characterArg ? [characterArg] : [])], {
  cwd: rootDir,
  env: { ...process.env, NODE_ENV: 'development' },
  shell: true,
});

// Run the web-cli
const webCliProcess = spawn('yarn', ['workspace', 'web-cli', 'start'], {
  cwd: rootDir,
  env: { 
    ...process.env,
    DISABLE_ESLINT_PLUGIN: 'true',
  },
  shell: true,
});

agentProcess.stdout.on('data', (data) => prefixOutput('agent', colors.blue, data));
agentProcess.stderr.on('data', (data) => prefixOutput('agent', colors.blue, data));

webCliProcess.stdout.on('data', (data) => prefixOutput('web-cli', colors.green, data));
webCliProcess.stderr.on('data', (data) => prefixOutput('web-cli', colors.green, data));

const cleanup = () => {
  closeAllVectorDBs();
  agentProcess.kill();
  webCliProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

agentProcess.on('error', (error) => {
  console.error(`Agent process error: ${error.message}`);
  cleanup();
});

webCliProcess.on('error', (error) => {
  console.error(`Web-CLI process error: ${error.message}`);
  cleanup();
});

agentProcess.on('exit', (code) => {
  console.log(`Agent process exited with code ${code}`);
  cleanup();
});

webCliProcess.on('exit', (code) => {
  console.log(`Web-CLI process exited with code ${code}`);
  cleanup();
}); 