# Autonomys Web CLI

A web-based interface for interacting with the Autonomys agent API.

## Setup

1. Clone the repository
2. Install dependencies
```bash
yarn install
```

3. Configure environment variables
   - Copy `.env.sample` to `.env`
   - Set the appropriate values in the `.env` file:
     - `PORT`: The web-cli port. (default: 3000)
     - `REACT_APP_API_BASE_URL`: The base URL of Agent API
     - `REACT_APP_API_TOKEN`: The API authentication token matching the one configured in the Agent API server

## API Authentication

The web interface communicates with the Agent API server using bearer token authentication. For this to work:

1. Make sure the Agent API server (in your character folder) has authentication enabled with a token:
   - In your Agent API server's `.env` file, set:
     ```
     API_TOKEN=your_secure_token_here
     ENABLE_AUTH=true
     ```

2. Use the same token in the web CLI:
   - In the web CLI's `.env` file, set:
     ```
     REACT_APP_API_TOKEN=your_secure_token_here
     ```

## Development

Start the development server:
```bash
yarn start
```

## Build

Create a production build:
```bash
yarn build
```

The build artifacts will be stored in the `build/` directory. 