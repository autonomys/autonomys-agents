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
   `yarn install`

2. Copy the environment file and configure your credentials:
   `cp .env.sample .env`

3. Create your agent character by copying the example:
   `cp src/agents/workflows/kol/characters/character.example.ts src/agents/workflows/kol/characters/character.ts`

4. Configure your character:

   ```
   // character.ts
   const name = 'Your Agent Name';
   const username = 'twitter_handle';
   const walletAddress = '0x...'; // Your Autonomys Network wallet
   const description = 'Your agent's personality description...';


    // Configure additional personality traits, expertise, rules, etc.
   ```

## Character Configuration

The character configuration defines your agent's personality and behavior. Key sections include:

- `description`: Core personality and background
- `personality`: Key behavioral traits
- `expertise`: Areas of knowledge
- `rules`: Operating guidelines
- `trendFocus`: Topics to monitor
- `contentFocus`: Content creation guidelines
- `replyStyle`: Engagement approach
- `wordsToAvoid`: Restricted vocabulary

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
`yarn dev`

Monitor the agent's activity in the console and configured log files.

## License

MIT
