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

1. Install dependencies:
   `yarn install`

2. Copy the environment file and configure your credentials:
   `cp .env.sample .env`

3. Configure your `.env` file with required credentials:

   ```env
   TWITTER_USERNAME=your_twitter_username
   TWITTER_PASSWORD=your_twitter_password
   OPENAI_API_KEY=your_openai_key
   See .env.sample for other configuration options
   ```

4. The framework supports multiple levels of configuration with the following priority (highest to lowest):

   1. Environment variables (`.env` file)
   2. YAML configuration (`config/config.yaml`)
   3. Default values in code

This means you can:

- Use YAML for most settings
- Override sensitive data (like API keys) using environment variables
- Fall back to default values if nothing is specified

### YAML Configuration

1. Copy the example configuration file:

   ```bash
   cp config/config.example.yaml config/config.yaml
   ```

2. Customize the settings in `config/config.yaml`:

   ```yaml
   twitter:
     NUM_TIMELINE_TWEETS: 10
     NUM_FOLLOWING_RECENT_TWEETS: 10
     NUM_RANDOM_FOLLOWINGS: 5
     MAX_MENTIONS: 20
     MAX_THREAD_LENGTH: 20
     MAX_MY_RECENT_TWEETS: 10
     MAX_MY_RECENT_REPLIES: 10
     RESPONSE_INTERVAL_MS: 3600000 # 1 hour
     POST_INTERVAL_MS: 5400000 # 1.5 hours
     POST_TWEETS: false

   autodrive:
     upload: false

   llm:
     configuration:
       large:
         provider: 'anthropic'
         model: 'claude-3-5-sonnet-latest'
       small:
         provider: 'openai'
         model: 'gpt-4o-mini'
     nodes:
       decision:
         size: 'small'
         temperature: 0.2
       analyze:
         size: 'large'
         temperature: 0.5
       generation:
         size: 'large'
         temperature: 0.8
       response:
         size: 'small'
         temperature: 0.8

     memory:
       MAX_PROCESSED_IDS: 5000
   ```

## Character System

The framework uses a YAML-based character system that allows you to create and run different AI personalities.

### Creating Characters

1. Characters are stored in `config/characters/`
2. Create new characters by copying the example:
   ```bash
   # Create a new character
   cp config/characters/character.example.yaml config/characters/my-character.yaml
   ```

### Character Configuration

Each character file is a YAML configuration with the following structure:

```yaml
name: 'Agent Name'
username: 'twitter_handle'
description: |
  Core personality description
  Can span multiple lines

personality:
  - Key behavioral trait 1
  - Key behavioral trait 2

expertise:
  - Area of knowledge 1
  - Area of knowledge 2

rules:
  - Operating guideline 1
  - Operating guideline 2

trend_focus:
  - Topic to monitor 1
  - Topic to monitor 2

content_focus:
  - Content guideline 1
  - Content guideline 2

reply_style:
  - Engagement approach 1
  - Engagement approach 2

words_to_avoid:
  - word1
  - word2

engagement_criteria:
  - Engagement rule 1
  - Engagement rule 2
```

### Running with Different Characters

Run the agent with a specific character:

You can run the agent with a specific character by providing the character name as an argument.

```bash
# Use default character (configured in config.yaml)
yarn dev  # for development with auto-reload - select from list of characters
# or
yarn start  # for production build and run - select from list of characters


# Use a specific character (omit .yaml extension)
yarn dev my-agent  # for development with auto-reload
# or
yarn start my-agent  # for production build and run

# Examples:
# If your character file is named 'techie.yaml':
yarn dev techie
# If your character file is named 'my-agent.yaml':
yarn dev my-agent
```

Note: When specifying a character file, omit the `.yaml` extension. The system will automatically look for the YAML file in the `config/characters/` directory.

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

## Workflows

### Twitter

The Twitter workflow enables agents to:

- Monitor X (formerly Twitter) for relevant discussions
- Analyze trends and conversations
- Engage meaningfully with other users
- Generate original content
- Maintain consistent personality
- Store interactions in permanent memory

## Running the Agent

Start the agent with:

```bash
# Use example character or select from list of characters
yarn dev

# Use specific character
yarn dev my-agent
```

Monitor the agent's activity in the console and configured log files.

## Resurrection

To resurrect memories from the Autonomys Network, run the following command:

### Options

- `-o, --output`: (Optional) The directory where memories will be saved. Defaults to `./memories`
- `-n, --number`: (Optional) Number of memories to fetch. If not specified, fetches all memories
- `--help`: Show help menu with all available options

Examples:

```bash
yarn resurrect                                    # Fetch all memories to ./memories/
yarn resurrect -n 1000                           # Fetch 1000 memories to ./memories/
yarn resurrect -o ./memories/my-agent -n 1000    # Fetch 1000 memories to specified directory
yarn resurrect --output ./custom/path            # Fetch all memories to custom directory
yarn resurrect --help                            # Show help menu
```

```

## Testing

To run tests:

```bash
yarn test
```## License

MIT


