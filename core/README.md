# @autonomys/agent-core

The core package for building autonomous AI agents. This package is extracted from the [Autonomys Agents](https://github.com/autonomys/autonomys-agents) framework.

## Installation

```bash
npm install @autonomys/agent-core
# or
yarn add @autonomys/agent-core
```

## Features

- Agent orchestration and workflow management
- Integration with major LLM providers (OpenAI, Anthropic, etc.)
- Tools for interacting with external services:
  - Slack integration
  - Twitter automation
  - GitHub operations
  - Notion connectivity
  - Web search capabilities
- Vector database integration for agent memory
- Configurable character system for agent personalities
- Blockchain integration for agent experience tracking
- API server for external control and monitoring
- Task scheduling and execution
- Experience management and monitoring

## Usage

Here's how to use the core package in your own project:

```typescript
import {
  // Configuration tools
  getConfig,
  
  // Agent creation
  createOrchestratorRunner,
  createPrompts,
  registerOrchestratorRunner,
  
  // Tool integrations
  createAllSchedulerTools,
  createWebSearchTool,
  createTwitterApi,
  createSlackTools,
  createFirecrawlTools,
  
  // Agent types
  createTwitterAgent,
  
  // Workflow management
  startTaskExecutor,
  
  // API server
  createApiServer,
  withApiLogger,
  
  // Utilities
  createExperienceManager,
  createLogger,
  closeAllVectorDBs
} from '@autonomys/agent-core';

// Your implementation here...
```

## Required Character Structure

When using this package, you'll need to set up a character structure in your project:

```
characters/
  ├── your-character-name/
  │   ├── config/
  │   │   ├── .env                # Environment variables
  │   │   ├── config.yaml         # Configuration settings
  │   │   └── your-character.yaml # Character personality definition
  │   ├── data/                   # For agent data storage
  │   ├── logs/                   # For agent logs
  │   └── memories/               # For agent memory storage
```

**Note**: Example character configurations are available in the [Autonomys Agents GitHub repository](https://github.com/autonomys/autonomys-agents/tree/main/characters) to help you get started.

## API Server Certificate Requirements

**Important**: When running without the `--headless` flag, the API server requires SSL certificates. You must create a `certs` directory in your workspace root with the following files:

- `certs/server.cert` - SSL certificate
- `certs/server.key` - SSL private key 

You can generate these certificates using OpenSSL with this command:

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
  -keyout certs/server.key -out certs/server.cert -days 365
```

## Running Agents

The package automatically handles command-line arguments through the `getConfig()` function.

### Supported Command-Line Arguments

When running your agent implementation, these arguments are automatically parsed and processed:

- **Character Name**: The first positional argument specifies which character to run
  ```bash
  npx tsx your-script.ts my-character-name
  ```

- **--headless**: Run the agent without starting the API server
  ```bash
  npx tsx your-script.ts my-character-name --headless
  ```

- **--workspace PATH**: Specify a custom workspace root directory where the `characters` folder exists
  ```bash
  npx tsx your-script.ts my-character-name --workspace /path/to/your/project
  ```

### Example Script

Here's how you might set up a script to run your agent:

```typescript
// index.ts or agent.ts
import { getConfig /* other imports */ } from '@autonomys/agent-core';

// The getConfig function automatically parses command-line arguments
const main = async (): Promise<void> => {
  const configInstance = await getConfig();
  // ... rest of your agent code
};

main().catch(error => {
  console.error('Error running agent:', error);
  process.exit(1);
});
```

Then run it with:

```bash
npx tsx index.ts my-character-name
npx tsx index.ts my-character-name --headless
npx tsx index.ts my-character-name --workspace /path/to/workspace
```

## Example Implementation

Here's an example of implementing an agent using this package:

```typescript
import {
  getConfig,
  createOrchestratorRunner,
  createPrompts,
  createAllSchedulerTools,
  createTwitterApi,
  createTwitterAgent,
  startTaskExecutor,
  registerOrchestratorRunner,
  createLogger,
  closeAllVectorDBs
} from '@autonomys/agent-core';

// Get configuration (automatically parses command-line arguments)
const configInstance = await getConfig();
if (!configInstance) {
  throw new Error('Config instance not found');
}
const { config, characterName } = configInstance;
const character = config.characterConfig;

// Define LLM configurations
const modelConfigurations = {
  inputModelConfig: {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-latest',
    temperature: 0.6,
  },
  messageSummaryModelConfig: {
    provider: 'anthropic',
    model: 'claude-3-5-haiku-latest',
    temperature: 0.6,
  }
};

// Initialize tools
const schedulerTools = createAllSchedulerTools();

// Set up Twitter agent (if configured)
const twitterAgentTool = 
  config.twitterConfig.USERNAME && config.twitterConfig.PASSWORD
    ? [
        createTwitterAgent(
          await createTwitterApi(
            config.twitterConfig.USERNAME,
            config.twitterConfig.PASSWORD,
            config.twitterConfig.COOKIES_PATH,
          ),
          character,
          {
            tools: [...schedulerTools],
            postTweets: config.twitterConfig.POST_TWEETS,
            modelConfigurations: config.twitterConfig.model_configurations,
            characterDataPathConfig: {
              dataPath: character.characterPath,
            },
          },
        ),
      ]
    : [];

// Create orchestrator configuration
const orchestrationConfig = {
  modelConfigurations,
  tools: [
    ...twitterAgentTool,
    ...schedulerTools,
  ],
  prompts: await createPrompts(character),
  characterDataPathConfig: {
    dataPath: character.characterPath,
  },
};

// Create and register the runner
const runner = await createOrchestratorRunner(character, orchestrationConfig);
registerOrchestratorRunner('orchestrator', runner);

// Start task executor
const stopTaskExecutor = startTaskExecutor(runner, 'orchestrator');

// Handle graceful shutdown
process.on('SIGINT', () => {
  const logger = createLogger('app');
  logger.info('Received SIGINT. Shutting down...');
  stopTaskExecutor();
  closeAllVectorDBs();
  process.exit(0);
});
```

## Documentation

For detailed documentation and examples, please refer to our [GitHub repository](https://github.com/autonomys/autonomys-agents).

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/autonomys/autonomys-agents/blob/main/LICENSE) file for details.