# Auto Agent Contracts

Smart contract components for autonomous blockchain agents.

## Overview

This repository contains the core smart contracts that enable autonomous agent functionality on the blockchain, with a focus on memory management and state persistence.

## Contracts

- `AgentMemory.sol`: Manages persistent memory storage for autonomous agents
  - Stores and retrieves memory hashes per agent address
  - Provides memory state verification

## Development

Built using the Foundry development framework.

### Prerequisites

- [Foundry](https://getfoundry.sh/)

### Setup

1. Install dependencies:
   ```shell
   forge install
   ```

2. Run tests:
   ```shell
   forge test
   ```

3. Build contracts:
   ```shell
   forge build
   ```

### Testing

Tests are written using Foundry's testing framework. Key test files:

- `AgentMemory.t.sol`: Tests memory storage and retrieval functionality

Run tests with verbosity:
``shell
forge test -vvv
``

## License

MIT
