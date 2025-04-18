# Package Manager Indexer

This service listens to events from the AutonomysPackageRegistry smart contract and indexes the data into a PostgreSQL database. It also provides a REST API for querying the indexed tools and versions.

## Features

- Subscribes to AutonomysPackageRegistry contract events
- Indexes tools, versions, and ownership transfers
- Maintains a record of the latest processed blockchain block
- Handles service restarts with proper block tracking
- Provides a clean database schema for querying package information
- REST API for accessing tool information

## Prerequisites

- Node.js v20+
- PostgreSQL 14+
- Access to an Ethereum-compatible RPC endpoint

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd package-manager-indexer
yarn install
```

3. Copy the example environment file and fill in your values:

```bash
cp .env.sample .env
```

4. Update the `.env` file with your configuration:
   - `RPC_URL`: WebSocket RPC URL for the blockchain
   - `CONTRACT_ADDRESS`: Address of the AutonomysPackageRegistry contract
   - `DATABASE_URL`: PostgreSQL connection string
   - `START_BLOCK`: Starting block number for indexing (0 for genesis)
   - `API_PORT`: Port for the API server (default: 3000)

## Database Setup

1. Create a PostgreSQL database:

```bash
createdb package_registry
```

2. Run the database migrations:

```bash
yarn migrate
```

## Usage

Start the indexer service:

```bash
yarn build
yarn start
```

For development with automatic reloading:

```bash
yarn dev
```

## API Endpoints

The service exposes the following REST API endpoints:

### List All Tools

```
GET /api/v1/tools?page=1&limit=20&sortBy=created_at&sortOrder=desc
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by (created_at, updated_at, name)
- `sortOrder`: Sort direction (asc, desc)

### Get Tool by Name

```
GET /api/v1/tools/name/:name
```

### Get Tool Versions

```
GET /api/v1/tools/:toolId/versions
```

### Get Latest Versions

```
GET /api/v1/tools/latest
```

### Search Tools

```
GET /api/v1/tools/search?q=searchTerm&limit=10
```

Query parameters:
- `q`: Search term
- `limit`: Maximum results (default: 10)

### Get Tools by Publisher

```
GET /api/v1/tools/publisher/:address?page=1&limit=20
```

Query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Health Check

```
GET /health
```

## Database Schema

The database contains the following tables:

- **tools**: Records basic tool information and ownership
- **tool_versions**: Stores version information and content identifiers
- **indexer_state**: Tracks the last processed blockchain block
- **migrations**: Records applied database migrations

## Architecture

The indexer service follows a modular design:

1. **Blockchain Service**: Connects to the contract and listens for events
2. **Database Repository**: Handles database operations for tools and versions
3. **Event Handlers**: Process blockchain events and update the database
4. **API Server**: Exposes HTTP endpoints for querying the database
5. **Migration System**: Manages database schema changes