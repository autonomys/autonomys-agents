![Autonomys Agents Banner_1](https://github.com/user-attachments/assets/340c2a09-ddc6-49c1-83af-ec9cdd30ac01)

# Autonomys Agents: A framework for building autonomous AI agents

Autonomys Agents is an **EXPERIMENTAL** framework for building AI agents. Currently, the framework supports agents that can interact with social networks and maintain permanent memory through the Autonomys Network. We are still in the **EARLY STAGES OF DEVELOPMENT** and are actively seeking feedback and contributions. We will be rapidly adding many more workflows and features.

> **IMPORTANT**: The main branch of this repository is under active development and may contain breaking changes. Please use the latest stable release for production environments.


## Features

- 🤖 Autonomous social media engagement
- 🧠 Permanent agent memory storage via Autonomys Network
- 🔄 Built-in orchestration system
- 🐦 Twitter integration (with more platforms planned)
- 🎭 Customizable agent personalities
- 🛠️ Extensible tool system

## Getting Started

1. Create a new repository using the template at [autonomys-agent-template](https://github.com/autonomys/autonomys-agent-template)
2. Clone your new repository and install dependencies:
   ```bash
   git clone <your-repo-url>
   cd <your-repo-directory>
   yarn install
   ```
   - Windows users will need to install Visual Studio C++ Redistributable. They can be found here: https://aka.ms/vs/17/release/vc_redist.x64.exe
3. Create a character using the provided script:
   ```bash
   yarn create-character your_character_name
   ```
4. Configure your character:
   - Edit `characters/your_character_name/config/.env` with your API keys and credentials
      - `OPENAI_API_KEY` is required for the vector database that powers agent memory through embeddings
   - Customize `characters/your_character_name/config/config.yaml` for agent behavior
   - Define personality in `characters/your_character_name/config/your_character_name.yaml`
5. Generate SSL certificates (required for API server):
   ```bash
   yarn generate-certs
   ```

### Command Line Arguments

The agent supports the following command-line arguments:

- **Character Name**:
  ```bash
  yarn start my-character
  ```

- **--headless**: (Optional) Run the agent without starting the API server
  ```bash
  yarn start my-character --headless
  ```

- **--help**: Show available command-line options
  ```bash
  yarn start --help
  ```

> #### Note: The `--workspace` parameter is optional and should only be used when you want to store the characters, certs, and cookies directories in a custom location instead of the default path. Provide the absolute path to the parent directory that will contain these folders.

### Docker Deployment

Docker support allows you to run multiple agents in isolated containers. For detailed instructions on setting up Docker images and containers for your characters, visit our [autonomys-agent-template](https://github.com/autonomys/autonomys-agent-template) repository.

### Running Multiple Agents

You can run multiple agents simultaneously by:
1. Creating different character configurations
2. Generating separate compose files for each character
3. Using different `HOST_PORT` for each agent

Each agent will:
- Have its own isolated environment
- Use its own character configuration
- Store data in separate volumes
- Be accessible on its designated port

## Interactive Web CLI Interface

A modern web-based interface for interacting with your agent. To start:

1. **Configure Agent API**  
   In your agent character's `.env` file, add these API settings:
   ```
   API_PORT=3010
   API_TOKEN=your_api_token_min_32_chars_long_for_security
   ENABLE_AUTH=true
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001 
   ```

2. **Configure Web CLI**
   ```bash
   cp .env.sample .env
   ```

3. **Update Web CLI Environment**  
   Edit the `.env` file with your configuration:
   - `PORT`: The port for running the Web CLI interface
   - `REACT_APP_API_BASE_URL`: Your Agent API address (e.g., http://localhost:3010)
   - `REACT_APP_API_TOKEN`: The same token used in your agent configuration

4. **Start the Web Interface**
   ```bash
   yarn dev:web
   ```


## Web Cli With Docker
You can have web cli as a container by runnint the command below

```bash
docker run -d \
      -p <HOST_LOCAL_PORT>:<CONTAINER_PORT> \
      -e PORT=<CONTAINER_PORT> \
      -e RUNTIME_API_URL="<YOUR_API_URL>" \
      -e RUNTIME_API_TOKEN="<YOUR_API_TOKEN>" \
      --name autonomys-web-cli \
      ghcr.io/autonomys/autonomys-agents/web-cli:latest
```
## Examples

The following examples demonstrate the use of the framework and are available:

- [Twitter Agent](examples/twitterAgent/README.md)
- [Multi Personality](examples/multiPersonality/README.md)
- Github Agent
- Notion Agent
- Slack Agent
- Web3 Agent

To run each example run following command to see the options:
```bash
yarn example <example-name> <character> --workspace <absolute path to directory that contains characters, .cookies, and certs folders>
```

## Character System

The framework uses a YAML-based character system that allows you to create and run different AI personalities.

### Character Configuration

Each character file is a YAML configuration with the following structure. For an example character personality configuration, see [character.example.yaml](characters/character.example/config/character.example.yaml) and for example parameter configuration, see [config.example.yaml](characters/character.example/config/config.example.yaml).

## Context Size Management

The orchestrator includes a message pruning system to manage the LLM's context window size. This is important because LLMs have a limited context window, and long conversations need to be summarized to stay within these limits while retaining important information.

The pruning system works through two main parameters:

- `maxQueueSize` (default: 50): The maximum number of messages to keep before triggering a summarization
- `maxWindowSummary` (default: 10): How many of the most recent messages to keep after summarization

Here's how the pruning process works:

1. When the number of messages exceeds `maxQueueSize`, the summarization is triggered
2. The system creates a summary of messages from index 1 to `maxWindowSummary`
3. After summarization, the new message queue will contain:
   - The original first message
   - The new summary message
   - All messages from index `maxWindowSummary` onwards

You can configure these parameters when creating the orchestrator:

```typescript
const runner = await getOrchestratorRunner(character, {
  pruningParameters: {
    maxWindowSummary: 10, // Keep 10 most recent messages after summarization
    maxQueueSize: 50, // Trigger summarization when reaching 50 messages
  },
  // ... other configuration options
});
```

This ensures your agent can maintain long-running conversations while keeping the most relevant context within the LLM's context window limits.

## Autonomys Network Integration

The framework uses the Autonomys Network for permanent storage of agent memory and interactions. This enables:

- Persistent agent memory across sessions
- Verifiable interaction history
- Cross-agent memory sharing
- Decentralized agent identity

To use this feature:

1. Configure your `AUTO_DRIVE_API_KEY` in `.env` (obtain from https://ai3.storage)
2. Enable Auto Drive uploading in `config.yaml`
3. Provide your Taurus EVM wallet details (PRIVATE_KEY) and Agent Memory Contract Address (CONTRACT_ADDRESS) in `.env`
4. Make sure your Taurus EVM wallet has funds. A faucet can be found at https://subspacefaucet.com/
5. Provide encryption password in `.env` (optional, leave empty to not encrypt the agent memories)

<!-- ## Resurrection

To resurrect memories from the Autonomys Network, run the following command:

### Options

- `-n, --number`: (Optional) Number of memories to fetch. If not specified, fetches all memories
- `-w, --workspace`: (Optional) Specify the path to the project root directory where the `characters` folder exists. This is needed if you're running the command from outside the project or want to use a different project root. Defaults to the current project root directory.
- `--help`: Show help menu with all available options

Examples:

```bash
yarn resurrect your_character_name                       # Fetch all memories
yarn resurrect your_character_name -n 1000               # Fetch 1000 memories
yarn resurrect your_character_name --workspace=/path/to/your/project    # Use a custom workspace path where the 'characters' directory is located
yarn resurrect --help                                     # Show help menu
```

While memories are being fetched, they will be added to the vector database named `experiences` in the background, located in the character's data directory within the workspace. -->

<!-- ## Testing

To run tests:

```bash
yarn test
``` -->

## License

MIT
