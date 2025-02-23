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
4. Run your character:
   - For dev purposes in watch mode: `yarn dev <your-character-name>`
   - For production build and run: `yarn start <your-character-name>`
   - For interactive CLI interface: `yarn cli <your-character-name>`

## Interactive CLI Interface

The framework includes an interactive terminal-based UI for managing and monitoring your AI agent. To start the interface:

```bash
yarn cli <your-character-name>
```

Features:

- Real-time character status and workflow monitoring
- Interactive command input with keyboard shortcuts
- Task scheduling and management
- Live output logging

The interface provides a user-friendly way to interact with your agent, monitor its activities, and manage scheduled tasks, all within a terminal environment.

### Known Issues

- This feature is in the very early stages of development and will be rapidly evolving. See https://github.com/autonomys/autonomys-agents/issues/242 for more information on planned features and known bugs.

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
