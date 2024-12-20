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
    echo "Usage: $0 [local|taurus]"
    echo "  local  - Deploy to local Anvil chain"
    echo "  taurus - Deploy to Taurus network"
    exit 1
}

# Check if network argument is provided
if [ $# -ne 1 ]; then
    usage
fi

NETWORK=$1

case $NETWORK in
    "local")
        echo -e "${BLUE}Starting local Anvil chain...${NC}"
        # Check if Anvil is already running
        if lsof -i:8545 > /dev/null; then
            echo "Anvil is already running on port 8545"
        else
            anvil > /dev/null 2>&1 &
            sleep 2
        fi
        
        echo -e "${BLUE}Deploying to local network... ${LOCAL_RPC_URL}${NC}"
        forge script script/AgentMemory.s.sol:DeployScript \
            --rpc-url $LOCAL_RPC_URL \
            --private-key $ANVIL_PRIVATE_KEY \
            --broadcast
        ;;
        
    "taurus")
        echo -e "${BLUE}Deploying to Taurus network... ${TAURUS_RPC_URL}${NC}"
        forge script script/AgentMemory.s.sol:DeployScript \
            --rpc-url $TAURUS_RPC_URL \
            --private-key $PRIVATE_KEY \
            --evm-version london \
            --broadcast
        ;;
        
    *)
        usage
        ;;
esac

echo -e "${GREEN}Deployment complete!${NC}" 