# autoOS CLI `WIP`

A package manager and toolkit for Autonomys agent tools.

## Overview

autoOS CLI is a command-line interface for managing Autonomys agent tools. It allows developers to:

- Install agent tools from the registry
- Publish new tools to the registry
- List registered tools
- Configure tool settings
- Securely manage credentials

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm or yarn

### Global Installation

```bash
# Using npm
npm install -g @autonomys/agent-os-cli

# Using yarn
yarn global add @autonomys/agent-os-cli
```

### Local Installation

```bash
# Using npm
npm install @autonomys/agent-os-cli

# Using yarn
yarn add @autonomys/agent-os-cli
```

## Getting Started

After installation, set up your credentials and configuration:

```bash
autoOS config
```

This interactive wizard will guide you through:
- Setting up your Auto Drive API key
- Configuring your Auto Drive encryption password (optional)
- Setting up your Auto-EVM private key
- Choosing your preferred network (mainnet or Taurus)

## Core Commands

### Helo
```bash
autoOS -h
```

### Install a Tool

```bash
# Install the latest version
autoOS install <tool-name>

# Install a specific version
autoOS install <tool-name> -v <version>

# Install using a Content ID (CID)
autoOS install <tool-name> --cid <cid>

# Install locally to the current project
autoOS install <tool-name> --local
```

### Publish a Tool

```bash
# Publish a tool to the registry
autoOS publish <tool-path>

# Upload to Auto Drive without updating the registry
autoOS publish <tool-path> --no-registry
```

### List Registered Tools

```bash
# List tools with basic information
autoOS list
```

### Tool Inquiry

```bash
# Get information about a tool
autoOS tool -n <tool-name>

# Get information about a specific version
autoOS tool -n <tool-name> -v <version>

# Perform a specific action on a tool
autoOS tool -n <tool-name> -a <action>

# Example: Get metadata for a specific version
autoOS tool -n slack-tool -v 1.0.0 -a metadata
```

### Configure Settings

```bash
# Configure all settings
autoOS config

# Configure only credentials
autoOS config --credentials

# Configure only general settings
autoOS config --settings
```

### Clean Cached Files

```bash
# Clean with confirmation
autoOS clean

# Force clean without confirmation
autoOS clean --force
```

## Secure Credential Management

autoOS CLI securely manages all your credentials through your system's native keychain:

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

All credentials are encrypted and accessible only through the autoOS CLI with proper authentication.

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
autoOS publish .
```


### Installing and Using Your Tool

After publishing your tool, you can install it using:

```bash
autoOS install weather-tool --local
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

#### "Failed to decrypt credentials"

- Ensure you're using the correct master password
- Try running `autoOS config --credentials` to reset your credentials

#### API Key Issues

- Verify your API key at https://ai3.storage
- Ensure your network settings match your API key (mainnet or Taurus)


## Privacy and Security

- All credentials are encrypted with AES-256-CBC
- The master password is never stored in plaintext
- System keychain integration leverages OS-level security

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.