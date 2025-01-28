![Autonomys Agents Banner_1](https://github.com/user-attachments/assets/340c2a09-ddc6-49c1-83af-ec9cdd30ac01)

# Autonomys Agents: A framework for building autonomous AI agents

Autonomys Agents is an experimental framework for building AI agents. Currently, the framework supports agents that can interact with social networks and maintain permanent memory through the Autonomys Network. We are still in the early stages of development and are actively seeking feedback and contributions. We will be rapidly adding many more workflows and features.

## Features

- 🤖 Autonomous social media engagement
- 🧠 Permanent agent memory storage via Autonomys Network
- 🔄 Built-in workflow system
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

Each character file is a YAML configuration with the following structure:

```yaml
name: 'Agent Name'

description: |
  Core personality description
  Can span multiple lines

personality:
  - Key behavioral trait 1
  - Key behavioral trait 2

expertise:
  - Area of knowledge 1
  - Area of knowledge 2

communication_rules:
  rules:
    - Operating guideline 1
    - Operating guideline 2
  words_to_avoid:
    - word1
    - word2

twitter_profile:
  username: 'twitter_handle'
  trend_focus:
    - Topic to monitor 1
    - Topic to monitor 2

  content_focus:
    - Content guideline 1
    - Content guideline 2

  reply_style:
    - Engagement approach 1
    - Engagement approach 2

  engagement_criteria:
    - Engagement rule 1
    - Engagement rule 2
```

### Example Characters

1. Joy Builder (`joy_builder.yaml`):

   ```yaml
   name: 'Joy Builder'
   username: 'buildjoy'
   description: |
     Joy Builder is an AI agent who is relentlessly optimistic about technology's potential to solve human problems.
     The Joy represents their positive outlook, while Builder reflects their focus on practical solutions and progress.

   expertise:
     - Software development and system architecture
     - Open source and collaborative technologies
     - Developer tools and productivity
   # ... other configuration
   ```

2. Tech Analyst (`tech_analyst.yaml`):

   ```yaml
   name: 'Tech Analyst'
   username: 'techanalyst'
   description: |
     A thoughtful technology analyst focused on emerging trends.
     Provides balanced perspectives on technological developments.

   expertise:
     - AI and blockchain technology
     - Web3 and the future of the internet
     - Technical analysis and research
   # ... other configuration
   ```

## Workflows

### Twitter

The Twitter workflow enables agents to:

- Monitor X (formerly Twitter) for relevant discussions
- Analyze trends and conversations
- Engage meaningfully with other users
- Generate original content
- Maintain consistent personality
- Store interactions in permanent memory

## Autonomys Network Integration

The framework uses the Autonomys Network for permanent storage of agent memory and interactions. This enables:

- Persistent agent memory across sessions
- Verifiable interaction history
- Cross-agent memory sharing
- Decentralized agent identity

To use this feature:

1. Configure your AUTO_DRIVE_API_KEY in `.env` (obtain from https://ai3.storage)
2. Enable Auto Drive uploading in your `config.yaml`:
   ```yaml
   auto_drive:
     upload: true
   ```
3. Provide your Taurus EVM wallet details (PRIVATE_KEY) and Agent Memory Contract Address (CONTRACT_ADDRESS) in .env`
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

## Testing

To run tests:

```bash
yarn test
```

## License

MIT
