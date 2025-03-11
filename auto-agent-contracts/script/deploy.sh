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
    echo "Usage: $0 [local|taurus] [agent-memory|package-registry]"
    echo "  local|taurus           - Network to deploy to"
    echo "  agent-memory|package-registry - Contract to deploy"
    exit 1
}

# Check if network argument is provided
if [ $# -ne 2 ]; then
    usage
fi

NETWORK=$1
CONTRACT=$2

# Function to deploy AgentMemory contract
deploy_agent_memory() {
    local network=$1
    local rpc_url=$2
    local private_key=$3
    local evm_version=$4
    
    echo -e "${BLUE}Deploying AgentMemory to $network network... ${rpc_url}${NC}"
    
    if [ -n "$evm_version" ]; then
        forge script script/AgentMemory.s.sol:DeployScript \
            --rpc-url $rpc_url \
            --private-key $private_key \
            --evm-version $evm_version \
            --broadcast
    else
        forge script script/AgentMemory.s.sol:DeployScript \
            --rpc-url $rpc_url \
            --private-key $private_key \
            --broadcast
    fi
}

# Function to deploy AutonomysPackageRegistry contract
deploy_package_registry() {
    local network=$1
    local rpc_url=$2
    local private_key=$3
    local evm_version=$4
    
    echo -e "${BLUE}Deploying AutonomysPackageRegistry to $network network... ${rpc_url}${NC}"
    
    if [ -n "$evm_version" ]; then
        forge script script/DeployAutonomysPackageRegistry.s.sol:DeployAutonomysPackageRegistry \
            --rpc-url $rpc_url \
            --private-key $private_key \
            --evm-version $evm_version \
            --broadcast
    else
        forge script script/DeployAutonomysPackageRegistry.s.sol:DeployAutonomysPackageRegistry \
            --rpc-url $rpc_url \
            --private-key $private_key \
            --broadcast
    fi
}

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
        
        case $CONTRACT in
            "agent-memory")
                deploy_agent_memory "local" $LOCAL_RPC_URL $ANVIL_PRIVATE_KEY ""
                ;;
            "package-registry")
                deploy_package_registry "local" $LOCAL_RPC_URL $ANVIL_PRIVATE_KEY ""
                ;;
            *)
                echo "Invalid contract type. Choose 'agent-memory' or 'package-registry'"
                usage
                ;;
        esac
        ;;
        
    "taurus")
        case $CONTRACT in
            "agent-memory")
                deploy_agent_memory "Taurus" $TAURUS_RPC_URL $PRIVATE_KEY "london"
                ;;
            "package-registry")
                deploy_package_registry "Taurus" $TAURUS_RPC_URL $PRIVATE_KEY "london"
                ;;
            *)
                echo "Invalid contract type. Choose 'agent-memory' or 'package-registry'"
                usage
                ;;
        esac
        ;;
        
    *)
        usage
        ;;
esac

echo -e "${GREEN}Deployment complete!${NC}" 