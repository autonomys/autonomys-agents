#!/bin/sh
# Exit immediately if a command exits with a non-zero status.
set -e

# Define defaults if runtime variables aren't set
export RUNTIME_API_URL=${RUNTIME_API_URL:-http://localhost:3010}
# Use :- which defaults to empty string if RUNTIME_API_TOKEN is unset or null
export RUNTIME_API_TOKEN=${RUNTIME_API_TOKEN:-}
export PORT=${PORT:-3000}

echo "Window Runtime Configuration:"
echo " API URL: $RUNTIME_API_URL"
echo " Token Present: $(if [ -n "$RUNTIME_API_TOKEN" ]; then echo true; else echo false; fi)"
echo " Port: $PORT"

# Inject runtime variables into a JS file that index.html can load
# Create a config file in the build directory
echo "window.runtimeConfig = {" > /app/build/runtime-config.js
echo "  API_BASE_URL: \"$RUNTIME_API_URL\"," >> /app/build/runtime-config.js
echo "  API_TOKEN: \"$RUNTIME_API_TOKEN\"" >> /app/build/runtime-config.js
echo "};" >> /app/build/runtime-config.js

# Add the script tag to index.html (use sed to insert before </head>)
# Use a temporary file for sed compatibility
sed -i.bak 's|\(</head>\)|<script src="/runtime-config.js"></script>\1|' /app/build/index.html

echo "Starting server..."
# Execute the original CMD (serve)
exec serve -s build -l ${PORT} 