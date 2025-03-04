import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(__dirname);

const characterArg = process.argv.slice(2).join(' ');

export const loadCharacter = (characterName: string): [number, number,string] => {    
    if (!characterName) {
        throw new Error('Character name is required');
    }
    
    try { 
        let apiPort, webCliPort, name;;
        const characterPath = join(process.cwd(), 'characters', characterName);
        const envPath = join(characterPath, 'config', '.env');
        const envContent = readFileSync(envPath, 'utf8');
        
        const portMatch = envContent.match(/API_PORT=(\d+)/);
        if (portMatch && portMatch[1]) {
            apiPort = parseInt(portMatch[1], 10);
        }

        const webCliPortMatch = envContent.match(/WEB_CLI_PORT=(\d+)/);
        if (webCliPortMatch && webCliPortMatch[1]) {
            webCliPort = parseInt(webCliPortMatch[1], 10);
        }

        const characterYamlPath = join(characterPath, 'config', `${characterName}.yaml`);
        const characterYamlContent = readFileSync(characterYamlPath, 'utf8');
        const characterNameMatch = characterYamlContent.match(/name: '([^']+)'/);
        if (characterNameMatch && characterNameMatch[1]) {
            name = characterNameMatch[1];
        }

        return [apiPort, webCliPort, name];
    } catch (error) {
        console.error(`Failed to load API_PORT for '${characterName}':`, error);
        throw new Error('Failed to load API_PORT for ' + error);
    }
};

const [apiPort, webCliPort, characterName] = characterArg ? loadCharacter(characterArg) : [3001, 3000, "default"];
console.log(`Using API port ${apiPort} for character '${characterName}'`);

const colors = {
  blue: '\x1b[34m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
};

function prefixOutput(prefix: string, color: string, data: Buffer) {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      process.stdout.write(`${color}[${prefix}]${colors.reset} ${line}\n`);
    }
  }
}

const backendProcess = spawn('tsx', ['--no-cache', '--watch', 'src/index.ts', ...(characterArg ? [characterArg] : [])], {
  cwd: rootDir, 
  env: { ...process.env, NODE_ENV: 'development' },
  shell: true,
});

const webCliProcess = spawn('yarn', ['start'], {
  cwd: `${rootDir}/web-cli`,
  env: { 
    ...process.env,
    PORT: webCliPort.toString(),
    REACT_APP_API_PORT: apiPort.toString(),
    REACT_APP_CHARACTER: characterName
  },
  shell: true,
});

backendProcess.stdout.on('data', (data) => prefixOutput('backend', colors.blue, data));
backendProcess.stderr.on('data', (data) => prefixOutput('backend', colors.blue, data));

webCliProcess.stdout.on('data', (data) => prefixOutput('web-cli', colors.green, data));
webCliProcess.stderr.on('data', (data) => prefixOutput('web-cli', colors.green, data));

const cleanup = () => {
  backendProcess.kill();
  webCliProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

backendProcess.on('error', (error) => {
  console.error(`Backend process error: ${error.message}`);
  cleanup();
});

webCliProcess.on('error', (error) => {
  console.error(`Web-CLI process error: ${error.message}`);
  cleanup();
});

backendProcess.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
  cleanup();
});

webCliProcess.on('exit', (code) => {
  console.log(`Web-CLI process exited with code ${code}`);
  cleanup();
}); 