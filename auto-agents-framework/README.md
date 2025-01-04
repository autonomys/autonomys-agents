# Auto-Agents-Framework: Framework for building AI agents

Auto-Agents-Framework is an experimental framework for building AI agents that can interact with social networks and maintain permanent memory through the Autonomys Network. The framework currently includes a "Key Opinion Leader" (KOL) workflow that enables agents to engage meaningfully on social platforms.

## Features

- 🤖 Autonomous social media engagement
- 🧠 Permanent agent memory storage via Autonomys Network
- 🔄 Built-in workflow system
- 🐦 Twitter integration (with more platforms planned)
- 🎭 Customizable agent personalities
- 🛠️ Extensible tool system

## Getting Started

1. Install dependencies:
   `yarn install
`

2. Copy the environment file and configure your credentials:
   `cp .env.sample .env`

3. Configure your `.env` file with required credentials:
   ``env
   TWITTER_USERNAME=your_twitter_username
   TWITTER_PASSWORD=your_twitter_password
   OPENAI_API_KEY=your_openai_key
   # See .env.sample for other configuration options
   ``

## Character System

The framework uses a character system that allows you to create and run different AI personalities.

### Creating Characters

1. Characters are stored in `src/agents/workflows/kol/characters/`
2. Create new characters by copying the example:
   ```bash
   # Create a new character
   cp src/agents/workflows/kol/characters/character.example.ts src/agents/workflows/kol/characters/my-character.ts
   ```

### Character Configuration

Each character file should export a `character` object with the following properties:

```typescript
export const character = {
  name: 'Agent Name',
  username: 'twitter_handle',
  description: 'Core personality description',
  personality: 'Key behavioral traits',
  expertise: 'Areas of knowledge',
  rules: 'Operating guidelines',
  trendFocus: 'Topics to monitor',
  contentFocus: 'Content creation guidelines',
  replyStyle: 'Engagement approach',
  wordsToAvoid: ['list', 'of', 'words', 'to', 'avoid'],
  engagementCriteria: 'Rules for when to engage with tweets',
};
```

### Running with Different Characters

Run the agent with a specific character:

```bash
# Use default character (character.ts)
yarn dev  # for development with auto-reload
# or
yarn start  # for production build and run

# Use a specific character (omit both .ts and .js extensions)
yarn dev argumint  # for development with auto-reload
# or
yarn start argumint  # for production build and run

# Examples:
# If your character file is named 'techie.ts':
yarn dev techie
# If your character file is named 'my-agent.ts':
yarn dev my-agent
```

Note: When specifying a character file, omit both `.ts` and `.js` extensions. The system will automatically use the correct extension for development (`.ts`) and production (`.js`).

### Example Characters

1. Default Rational Agent (`character.ts`):

   ```typescript
   export const character = {
     name: 'Rational Thinker',
     username: 'RationalBot',
     description: 'A logical and analytical personality focused on clear reasoning',
     expertise: 'Logic, critical thinking, cognitive biases',
     trendFocus: 'Rational discourse, logical fallacies, clear thinking',
     // ... other configuration
   };
   ```

2. Tech Enthusiast (`techie.ts`):
   ```typescript
   export const character = {
     name: 'Tech Explorer',
     username: 'TechieBot',
     description: 'An enthusiastic tech analyst exploring emerging technologies',
     expertise: 'AI, blockchain, web3, programming',
     trendFocus: 'Tech news, programming, AI developments',
     // ... other configuration
   };
   ```

## Autonomys Network Integration

The framework uses the Autonomys Network for permanent storage of agent memory and interactions. This enables:

- Persistent agent memory across sessions
- Verifiable interaction history
- Cross-agent memory sharing
- Decentralized agent identity

To use this feature:

1. Configure your Autonomys Network credentials in `.env`
2. Set `AUTO_DRIVE_UPLOAD=true`
3. Provide your wallet details and encryption password

## Workflows

### KOL (Key Opinion Leader)

The KOL workflow enables agents to:

- Monitor social media for relevant discussions
- Analyze trends and conversations
- Engage meaningfully with other users
- Generate original content
- Maintain consistent personality
- Store interactions in permanent memory

## Running the Agent

Start the agent with:

```bash
# Use default character
yarn dev

# Use a specific character (without .ts extension)
yarn dev argumint
```

Monitor the agent's activity in the console and configured log files.

## License

MIT
