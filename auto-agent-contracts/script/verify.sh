#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 [agent-memory|package-registry] <contract_address>"
    echo "  agent-memory|package-registry - Contract type to verify"
    echo "  contract_address - Address of the deployed contract to verify"
    exit 1
}

# Check if arguments are provided
if [ $# -ne 2 ]; then
    usage
fi

CONTRACT_TYPE=$1
CONTRACT_ADDRESS=$2

# Taurus Blockscout API URL
BLOCKSCOUT_API="https://blockscout.taurus.autonomys.xyz/api/"
CHAIN_ID=490000
COMPILER_VERSION="0.8.28"
EVM_VERSION="london"

case $CONTRACT_TYPE in
    "agent-memory")
        echo -e "${BLUE}Verifying AgentMemory contract at address ${CONTRACT_ADDRESS}...${NC}"
        
        forge verify-contract \
            --verifier blockscout \
            --verifier-url $BLOCKSCOUT_API -e "" \
            --evm-version $EVM_VERSION --chain $CHAIN_ID --compiler-version $COMPILER_VERSION \
            --watch \
            $CONTRACT_ADDRESS \
            src/AgentMemory.sol:AgentMemory
        ;;
        
    "package-registry")
        echo -e "${BLUE}Verifying AutonomysPackageRegistry contract at address ${CONTRACT_ADDRESS}...${NC}"
        
        forge verify-contract \
            --verifier blockscout \
            --verifier-url $BLOCKSCOUT_API -e "" \
            --evm-version $EVM_VERSION --chain $CHAIN_ID --compiler-version $COMPILER_VERSION \
            --watch \
            $CONTRACT_ADDRESS \
            src/AutonomysPackageRegistry.sol:AutonomysPackageRegistry
        ;;
        
    *)
        echo "Invalid contract type. Choose 'agent-memory' or 'package-registry'"
        usage
        ;;
esac

echo -e "${GREEN}Verification process initiated!${NC}"