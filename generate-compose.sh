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
TAG=${TAG:-latest}

# Create docker-compose.yml from template
sed "s/\${CHARACTER_NAME:-character.example}/$CHARACTER_NAME/g; \
    s/\${HOST_PORT:-3011}/$HOST_PORT/g; \
    s/\${API_PORT:-3011}/$API_PORT/g; \
    s/\${TAG:-latest}/$TAG/g" docker-compose-template.yml > "docker-compose-$CHARACTER_NAME.yml"

echo "Generated docker-compose-$CHARACTER_NAME.yml with:"
echo "CHARACTER_NAME: $CHARACTER_NAME"
echo "HOST_PORT: $HOST_PORT"
echo "API_PORT: $API_PORT"
echo
echo "To run the container:"
echo "--------------------"
echo "Build and start:"
echo "  docker compose -f docker-compose-$CHARACTER_NAME.yml up -d"
echo "  (-f specifies which compose file to use)"
echo
echo "Stop and remove:"
echo "  docker compose -f docker-compose-$CHARACTER_NAME.yml down"
echo
echo "To stop the container:"
echo "  docker compose -f docker-compose-$CHARACTER_NAME.yml down"
echo
echo "To start the container again:"
echo "  docker compose -f docker-compose-$CHARACTER_NAME.yml up -d"
echo
echo "View logs:"
echo "  docker compose -f docker-compose-$CHARACTER_NAME.yml logs -f"
echo "  (-f in 'logs -f' means follow: watch logs in real-time)"
echo
echo "Access container shell:"
echo "  docker exec -it autonomys-agent-$CHARACTER_NAME bash"
echo "  (bash is the default shell for the container)"
