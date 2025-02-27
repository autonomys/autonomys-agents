# Web3 Agent Example

This is a simple example demonstrating how to create an autonomous agent capable of interacting with blockchain networks using the Autonomys Agents framework.

## Features

- Connects to an Ethereum-compatible blockchain using ethers.js
- Performs native token transfers
- Checks account balances
- Uses the orchestrator workflow to manage agent tasks

## Usage

To run this example:

```bash
yarn examples/web3Agent <your-character-name>
```

## How It Works

The web3Agent example:

1. Sets up a connection to an Ethereum-compatible blockchain using the RPC URL and private key from your configuration
2. Creates blockchain-specific tools for the agent:
   - `transferNativeTokenTool`: Allows the agent to transfer ETH or other native tokens
   - `checkBalanceTool`: Allows the agent to check account balances
3. Initializes the orchestrator workflow with these tools
4. Executes a sample task to transfer AI3 and check balances

## Customization

You can modify the `initialMessage` in `index.ts` to give the agent different instructions for interacting with the blockchain.

## Configuration

This example uses the configuration from the main project. Ensure you have set the following in your `.env` file:

```
PRIVATE_KEY=your_wallet_private_key
RPC_URL=your_ethereum_rpc_url
```
