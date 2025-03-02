# autoOS CLI

A package manager and toolkit for Autonomys agent tools.

## Overview

autoOS CLI is a command-line interface for managing Autonomys agent tools. It allows developers to:

- Install agent tools from the registry
- Publish new tools to the registry
- List available tools
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

### List Available Tools

```bash
# List tools with basic information
autoOS list

# List tools with detailed information
autoOS list -d
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

autoOS CLI provides several secure options for managing your credentials:

### System Keychain Storage

By default, your master password is securely stored in your system's keychain (macOS Keychain, Windows Credential Manager, or Linux Secret Service). This allows you to:

- Access your credentials without re-entering your password
- Maintain security without environment variables
- Keep credentials encrypted at rest

### Password Caching

If you choose not to use the system keychain, your password can be:
- Cached in memory for the current session (10-minute timeout)
- Prompted for each operation
- Set via environment variable

### Environment Variable

For CI/CD or automated scripts, you can set your master password as an environment variable:

```bash
export AUTOOS_MASTER_PASSWORD="your-master-password"
```

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

#### "Master password not set"

- Set the `AUTOOS_MASTER_PASSWORD` environment variable, or
- Use the system keychain integration by running `autoOS config`

#### API Key Issues

- Verify your API key at https://ai3.storage
- Ensure your network settings match your API key (mainnet or Taurus)

### Logs

Verbose logs can help diagnose issues:

```bash
DEBUG=autoOS:* autoOS <command>
```

## Privacy and Security

- All credentials are encrypted with AES-256-CBC
- The master password is never stored in plaintext
- System keychain integration leverages OS-level security
- Network communication uses secure protocols

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.