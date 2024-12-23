# Auto Agent Contracts

Smart contract components for autonomous blockchain agents.

## Overview

This repository contains smart contracts that enable autonomous agent functionality on the blockchain, with a focus on memory management. Hashes represent the Blake3 hash component of a CID stored in the Autonomys Distributed Storage Network (DSN).

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
```shell
forge test -vvv
```

### Deployment

#### Local Development

1. Start local EVM chain:
   ```shell
   anvil
   ```

2. Deploy contract:
   ```shell
   bash ./script/deploy.sh local
   ```

#### Network Deployment

1. Deploy to Taurus network:
   ```shell
   bash ./deploy.sh taurus
   ```

3. Verify contract:
   ```shell
   bash ./script/verify.sh
   ```

Environment variables should be set in `.env`:
```shell
# Local testing
ANVIL_PRIVATE_KEY=0xac0974...
LOCAL_RPC_URL=http://localhost:8545

# Autonomys Taurus EVM Network
TAURUS_RPC_URL=your_taurus_rpc_url
PRIVATE_KEY=your_private_key
```

## License

MIT
