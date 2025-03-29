![Autonomys Agents Banner_1](https://github.com/user-attachments/assets/340c2a09-ddc6-49c1-83af-ec9cdd30ac01)

# Autonomys Agents: A framework for building autonomous AI agents

Autonomys Agents is an **EXPERIMENTAL** framework for building AI agents. Currently, the framework supports agents that can interact with social networks and maintain permanent memory through the Autonomys Network. We are still in the **EARLY STAGES OF DEVELOPMENT** and are actively seeking feedback and contributions. We will be rapidly adding many more workflows and features.

## Features

- 🤖 Autonomous social media engagement
- 🧠 Permanent agent memory storage via Autonomys Network
- 🔄 Built-in orchestration system
- 🐦 Twitter integration (with more platforms planned)
- 🎭 Customizable agent personalities
- 🛠️ Extensible tool system

## Getting Started

1. Install dependencies: `yarn install`
   - Windows users will need to install Visual Studio C++ Redistributable. They can be found here: https://aka.ms/vs/17/release/vc_redist.x64.exe
2. Create your character config: `yarn create-character <your-character-name>`
3. Setup character config:
   - All character configs are stored in `characters/{your-character-name}/config`
   - Update .env with applicable environment variables
   - Update `config.yaml` with applicable configuration
   - Update `{your-character-name}.yaml` with applicable personality configuration (See Character System below).
4. Agent API
   - The Agent API uses HTTP/2 protocol exclusively, requiring SSL certificates. Generate these by running `yarn generate-certs`
5. Run your character:
   - For dev purposes in watch mode: `yarn dev <your-character-name>`
   - For production build and run: `yarn start <your-character-name>`
6. Run your character in headless mode (without API):
   - For dev purposes in watch mode: `yarn dev <your-character-name> --headless`
   - For production build and run: `yarn start <your-character-name> --headless`

## Docker Deployment

You can also run your agents using Docker. This provides isolation and makes it easy to run multiple agents simultaneously.

### Prerequisites
- Docker installed on your system ([Installation Guide](https://docs.docker.com/get-docker/))
- Docker Compose Plugin required ([Compose Plugin Installation](https://docs.docker.com/compose/install/))
- Character configuration set up (follow steps 2-3 from Getting Started)

### Running with Docker

1. Generate your character's docker-compose file:

   First:
   ```bash
   chmod +x ./generate-compose.sh
   ```
   
   Then:
   ```bash
   ./generate-compose.sh <your-character-name> [HOST_PORT] [API_PORT]
   ```
   Example:
   ```bash
   # Run Alice on port 3011
   ./generate-compose.sh Alice 3011 3011
   
   # Run Bob on port 3012
   ./generate-compose.sh Bob 3012 3011
   ```

2. The script will generate a `docker-compose-{character-name}.yml` file and show you the available commands:
   - Build and start the container: 
     ```bash
     docker compose -f docker-compose-{character-name}.yml up -d
     ```
   - Stop and remove the container: 
     ```bash
     docker compose -f docker-compose-{character-name}.yml down
     ```
   - View container logs: 
     ```bash
     docker compose -f docker-compose-{character-name}.yml logs -f
     ```
   - Access container shell: 
     ```bash
     docker exec -it autonomys-agent-{character-name} bash
     ```

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

### Installation

1. **Install Dependencies**
   ```bash
   cd web-cli && yarn
   ```

2. **Configure Agent API**  
   In your agent character's `.env` file, add these API settings:
   ```
   API_PORT=3010
   API_TOKEN=your_api_token_min_32_chars_long_for_security
   ENABLE_AUTH=true
   CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001 
   ```

3. **Configure Web CLI**
   ```bash
   cp .env.sample .env
   ```

4. **Update Web CLI Environment**  
   Edit the `.env` file with your configuration:
   - `PORT`: The port for running the Web CLI interface
   - `REACT_APP_API_BASE_URL`: Your Agent API address (e.g., http://localhost:3010/api)
   - `REACT_APP_API_TOKEN`: The same token used in your agent configuration

5. **Start the Web Interface**
   ```bash
   yarn start
   ```

## Running with dev:all (Web-CLI And Agent)

The `dev:all` command launches both the main application and web interface concurrently:

```bash
yarn dev:all <your-character-name>
```

This command:
- Starts your agent with the specified character
- Launches the web interface configured for that character
- Automatically uses the character's API port from its .env file
- Provides color-coded output from both processes


## Examples

The following examples demonstrate the use of the framework and are available:

- [Twitter Agent](examples/twitterAgent/README.md)
- [Multi Personality](examples/multiPersonality/README.md)

## Character System

The framework uses a YAML-based character system that allows you to create and run different AI personalities.

### Creating Characters

1. Character related files are stored in `characters/{your-character-name}/`
2. Create new characters by running the `create-character.ts` script:

   ```bash
   # Create a new character
   yarn create-character your_character
   ```

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

1. Configure your AUTO_DRIVE_API_KEY in `.env` (obtain from https://ai3.storage)
2. Enable Auto Drive uploading in `config.yaml`
3. Provide your Taurus EVM wallet details (PRIVATE_KEY) and Agent Memory Contract Address (CONTRACT_ADDRESS) in `.env`
4. Make sure your Taurus EVM wallet has funds. A faucet can be found at https://subspacefaucet.com/
5. Provide encryption password in `.env` (optional, leave empty to not encrypt the agent memories)

## Resurrection

To resurrect memories from the Autonomys Network, run the following command:

### Options

- `-o, --output`: (Optional) The directory where memories will be saved. Defaults to `./memories`
- `-n, --number`: (Optional) Number of memories to fetch. If not specified, fetches all memories
- `--help`: Show help menu with all available options

Examples:

```bash
yarn resurrect your_character_name                                  # Fetch all memories to ./memories/
yarn resurrect your_character_name -n 1000                           # Fetch 1000 memories to ./memories/
yarn resurrect your_character_name -o ./memories/my-agent -n 1000    # Fetch 1000 memories to specified directory
yarn resurrect your_character_name --output ./custom/path            # Fetch all memories to custom directory
yarn resurrect --help                            # Show help menu
```

While memories are being fetched, they will be added to the vector database named `experiences` in the background, located in the <your_character_name> folder within the data directory.

## Testing

To run tests:

```bash
yarn test
```

## License

MIT
