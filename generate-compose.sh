#!/bin/bash

# Check if required arguments are provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 CHARACTER_NAME [HOST_PORT] [API_PORT]"
    echo "Example: $0 test1 3011 3011"
    exit 1
fi

# Set variables with defaults
CHARACTER_NAME=$1
HOST_PORT=${2:-3011}
API_PORT=${3:-3011}

# Create docker-compose.yml from template
sed "s/\${CHARACTER_NAME:-character.example}/$CHARACTER_NAME/g; \
    s/\${HOST_PORT:-3011}/$HOST_PORT/g; \
    s/\${API_PORT:-3011}/$API_PORT/g" docker-compose-template.yml > "docker-compose-$CHARACTER_NAME.yml"

echo "Generated docker-compose-$CHARACTER_NAME.yml with:"
echo "CHARACTER_NAME: $CHARACTER_NAME"
echo "HOST_PORT: $HOST_PORT"
echo "API_PORT: $API_PORT"
echo "Using published image: autosaeid/autonomys-agents:poc"
echo

# Check if the character directory exists
if [ ! -d "./characters/$CHARACTER_NAME" ]; then
    echo "Warning: Character directory './characters/$CHARACTER_NAME' does not exist."
    echo "Do you want to create it? (y/n)"
    read create_dir
    
    if [[ "$create_dir" =~ ^[Yy]$ ]]; then
        mkdir -p "./characters/$CHARACTER_NAME/config"
        mkdir -p "./characters/$CHARACTER_NAME/data"
        mkdir -p "./characters/$CHARACTER_NAME/logs"
        mkdir -p "./characters/$CHARACTER_NAME/memories"
        echo "Character directory structure created."
        
        # Create a sample .env file
        echo "# Configuration for $CHARACTER_NAME" > "./characters/$CHARACTER_NAME/config/.env"
        echo "# Add your environment variables here" >> "./characters/$CHARACTER_NAME/config/.env"
        echo "API_PORT=$API_PORT" >> "./characters/$CHARACTER_NAME/config/.env"
        echo "Sample .env file created in ./characters/$CHARACTER_NAME/config/.env"
    else
        echo "Warning: Container may fail to start without proper directory structure."
    fi
fi

# Check if certs directory exists
if [ ! -d "./certs" ]; then
    echo "Warning: Certs directory './certs' does not exist."
    echo "Do you want to create it? (y/n)"
    read create_certs
    
    if [[ "$create_certs" =~ ^[Yy]$ ]]; then
        mkdir -p "./certs"
        echo "Created certs directory. You will need to add your SSL certificates."
    fi
fi

# Check if .cookies directory exists
if [ ! -d "./.cookies" ]; then
    mkdir -p "./.cookies"
    echo "Created .cookies directory."
fi

echo "========================================================"
echo "How to run your agent"
echo "========================================================"
echo "1. Pull the image (first time or after updates):"
echo "   docker pull autosaeid/autonomys-agents:poc"
echo
echo "2. Start your character container:"
echo "   docker compose -f docker-compose-$CHARACTER_NAME.yml up -d"
echo
echo "3. Stop your character container:"
echo "   docker compose -f docker-compose-$CHARACTER_NAME.yml down"
echo
echo "Additional commands:"
echo "-------------------"
echo "View logs:"
echo "  docker compose -f docker-compose-$CHARACTER_NAME.yml logs -f"
echo
echo "Access container shell:"
echo "  docker exec -it autonomys-agent-$CHARACTER_NAME bash"
