# Auto Chain Agent

A blockchain interaction service that provides natural language processing capabilities for blockchain operations using LangGraph and LLMs.

## Features

- Natural language processing for blockchain interactions
- Memory-enabled conversations with context retention
- Balance checking and transaction management
- Wallet management
- Transaction history tracking

## Available Tools

The agent supports the following blockchain operations:

- `get_balance`: Check the balance of a blockchain address
- `send_transaction`: Send tokens to another address (supports AI3 token transfers)
- `get_transaction_history`: Retrieve transaction history and account information

The service consists of three main components:

- **Agents**: Core blockchain interaction and natural language processing
- **Backend**: API service for handling requests
- **Frontend**: User interface for interacting with the agent

## Setup

### Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- SQLite3

### Environment Variables

Create `.env` files in the respective directories following the `.env.example` file.

### Running the Services

```bash
yarn install
yarn dev
```
