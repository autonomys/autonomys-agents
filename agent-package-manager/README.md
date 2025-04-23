# agent-os CLI

A package manager and toolkit for Autonomys agent tools.

## Overview

agent-os CLI is a command-line interface for managing Autonomys agent tools. It allows developers to:

- Create new agent projects
- Install agent tools from the registry
- Publish new tools to the registry
- Search for registered tools
- Configure tool settings
- Securely manage credentials

> **Note:** Credentials are only required for publishing tools to the registry. You can freely install, search, and use tools without setting up credentials.

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Global Installation

```bash
# Using npm
npm install -g @autonomys/agent-os

# Using yarn
yarn global add @autonomys/agent-os
```

### Local Installation

```bash
# Using npm
npm install @autonomys/agent-os

# Using yarn
yarn add @autonomys/agent-os
```

## Getting Started

After installation, you can start using basic commands like `search` and `install` without any configuration.

To publish tools or perform operations that require blockchain interaction, set up your credentials:

```bash
agent-os config --credentials
```

This interactive wizard will guide you through:
- Setting up your Auto Drive API key
- Configuring your Auto Drive encryption password (optional)
- Setting up your Auto-EVM private key
- Choosing your preferred network (mainnet or Taurus)

## Core Commands

### Help
```bash
agent-os -h
```

### Create a New Agent Project

```bash
# Create a basic project
agent-os init my-agent-project

# Create a project, install dependencies, and create a character
agent-os init my-agent-project --install --character=my-character --api
```

Options:
- `--install`: Automatically install dependencies after project creation
- `--character <name>`: Create a character with the specified name
- `--api`: Generate API certificates for the project (default: true)

### Install a Tool

```bash
# Install the latest version
agent-os install <tool-name>

# Install a specific version
agent-os install <tool-name> -v <version>

# Install using a Content ID (CID)
agent-os install <tool-name> --cid <cid>
```

### Publish a Tool

```bash
# Publish a tool to the registry
agent-os publish <tool-path>

# Upload to Auto Drive without updating the registry
agent-os publish <tool-path> --no-registry
```

### Search for Tools

```bash
# Search for tools in the registry
agent-os search <search-term>

# Show detailed information in search results
agent-os search <search-term> -d
```

### Tool Inquiry

```bash
# Get information about a tool
agent-os tool -n <tool-name>

# Get information about a specific version
agent-os tool -n <tool-name> -v <version>

# Perform a specific action on a tool
agent-os tool -n <tool-name> -a <action>

# Example: Get metadata for a specific version
agent-os tool -n slack-tool -v 1.0.0 -a metadata
```

### Configure Settings

```bash
# Configure all settings
agent-os config

# Configure only credentials
agent-os config --credentials

# General Config
agent-os config --settings
```


### Clean Cached Files

```bash
# Clean with confirmation
agent-os clean

# Force clean without confirmation
agent-os clean --force
```

## Secure Credential Management

agent-os CLI securely manages all your credentials through your system's native keychain. Note that credentials are **only required for publishing tools** - you can freely install and search for tools without setting up credentials.

### System Keychain Integration

Your credentials are automatically stored in your system's secure keychain:
- macOS: Keychain Access
- Windows: Credential Manager 
- Linux: Secret Service API (GNOME Keyring, KWallet, etc.)

This approach provides several security benefits:
- OS-level security with encryption at rest
- No need for environment variables
- Credentials are never stored in plaintext
- Automatic authentication without re-entering passwords
- Separation from application code

### Credential Types

The following credentials are securely managed:
- Auto Drive API key
- Auto Drive encryption password
- Auto-EVM private key

All credentials are encrypted and accessible only through the agent-os CLI with proper authentication.

## Tool Structure

To create a publishable tool, your tool directory should have the following structure:

```
tool-directory/
├── manifest.json         # Tool metadata
├── index.js              # Main entry point
└── ... (other files)     # Additional files
```

The manifest.json should contain:

```json
{
  "name": "tool-name",
  "version": "1.0.0",
  "description": "Tool description",
  "author": "Your Name",
  "main": "index.js",
  "dependencies": {
    "dependency": "^1.0.0"
  }
}
```

## Sample Tool Example

Below is a complete example of how to create, use, and publish a simple tool for Autonomys agents.

### Tool Implementation

First, create a new directory for your tool:

```bash
mkdir weather-tool
cd weather-tool
```

Create a `manifest.json` file:

```json
{
  "name": "weather-tool",
  "version": "1.0.0",
  "description": "A tool for fetching weather data",
  "author": "Your Name",
  "main": "index.ts",
  "dependencies": {
    "@langchain/core": "^0.1.0",
    "zod": "^3.22.4",
    "axios": "^1.6.0"
  },
  "keywords": ["weather", "forecast", "api"]
}
```

Then create the main `index.ts` file:

```typescript
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

/**
 * A tool that fetches current weather data for a given location
 */
export const createWeatherTool = (apiKey: string) => new DynamicStructuredTool({
  name: "get_weather",
  description: "Get current weather for a location",
  schema: z.object({
    location: z.string().describe("The city and country, e.g., 'London, UK'"),
    units: z.enum(["metric", "imperial"]).optional()
      .describe("Temperature units (metric or imperial). Default: metric")
  }),
  func: async ({ location, units = "metric" }) => {
    try {
      // API key is now passed as a parameter to the tool creator function
      const url = `https://api.example.com/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`;
      
      const response = await axios.get(url);
      const data = response.data;
      
      return JSON.stringify({
        location: location,
        temperature: data.main.temp,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed
      });
    } catch (error) {
      return `Error fetching weather: ${error.message}`;
    }
  }
});

// Export the tools creation function for the Autonomys agent system
export const createTools = (apiKey: string) => {
  return [createWeatherTool(apiKey)];
};

// Default export
export default { createTools };
```

### Publishing Your Tool

When you're ready to publish:

```bash
# Navigate to your tool directory
cd weather-tool

# Publish to the registry
agent-os publish .
```

### Installing and Using Your Tool

After publishing your tool, you can install it using:

```bash
agent-os install weather-tool
```

Then, in your agent code, you can import and use the tool:

```typescript
import { createWeatherTool } from './tools/weather-tool';

// Get the weather tool with your API key
const weatherTool = createWeatherTool('your-api-key-here');

// Add it to your agent's tools
const agent = new <Agent-Instantiation>({
  tools: [weatherTool, ...otherTools],
  // other agent configuration
});
```

## Troubleshooting

### Common Issues

#### "Failed to decrypt credentials" or "No credentials found"

- This error usually appears when trying to publish a tool without configuring credentials
- Run `agent-os config --credentials` to set up your credentials for publishing
- Remember that credentials are only required for publishing tools, not for installing or searching

#### API Key Issues

- Verify your API key at https://ai3.storage
- Ensure your network settings match your API key (mainnet or Taurus)

## Privacy and Security

- All credentials are securely stored in your system's native keychain
- The Auto-EVM private key is required for blockchain operations

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.