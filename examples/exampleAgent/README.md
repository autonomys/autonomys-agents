# Example Agent Project

This project demonstrates how to use the `@autonomys/agent-core` package to create an autonomous agent with Twitter integration, API server support, and experience management.

## Prerequisites

- Node.js 20.18.1 or later
- [OpenSSL](https://www.openssl.org/) (for certificate generation)
- LLM Providers API Key
- Auto Drive API Key [You can create one here](ai3.storage)
## Project Structure

```
examples/exampleAgent/
├── agent.ts          # Main agent implementation
├── package.json      # Project dependencies
├── tsconfig.json     # TypeScript configuration
├── README.md         # This file
└── characters/       # Character configurations
    └── my-character/
        ├── config/
        │   ├── .env                # Environment variables
        │   ├── config.yaml         # Agent configuration
        │   └── my-character.yaml   # Character personality
        ├── data/                   # Data storage (created at runtime)
        ├── logs/                   # Log files (created at runtime)
        └── memories/               # Memory storage (created at runtime)
```

## Getting Started

1. Install dependencies:
   ```bash
   yarn install
   ```

2. Create a character configuration:
   - Create a directory structure for your character as shown above
   - Configure the `.env`, `config.yaml`, and character YAML files
   - See the `character.example`

3. Generate SSL certificates (required for API server):
   ```bash
   mkdir -p certs
   openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj '/CN=localhost' \
     -keyout certs/server.key -out certs/server.cert -days 365
   ```

4. Run the agent:
   ```bash
   # Specify the workspace path that characters and certs folder exist
   yarn start my-character-name --workspace=/path/to/workspace
   
   # Run in headless mode (no API server)
   yarn start my-character-name --headless
   ```

## Extending the Agent

You can extend this example by:

1. Adding custom tools in separate files
2. Integrating with other services (Slack, GitHub, etc.)
3. Creating custom agent workflows
4. Adding new commands to the API server