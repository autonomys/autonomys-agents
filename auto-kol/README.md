# Auto-KOL

AI Agent Framework for Twitter Engagement with Key Opinion Leaders (KOLs)

## Components

### Agent Service (`/agent`)
Backend service that handles the core AI agent functionality:
- Automated tweet monitoring (timeline, search, mentions)
- LLM-powered engagement decisions and response generation
- Multi-step workflow with tone analysis
- ChromaDB for semantic tweet storage
- DSN (Decentralized Storage Network) integration
- SQLite for queue management
- Human-in-the-loop approval system
- REST API endpoints for frontend integration

### Dashboard (`/frontend`)
React-based admin dashboard for managing the agent:
- Monitor pending responses
- Approve/reject generated responses
- Review skipped tweets
- Move skipped tweets back to response queue
- Retro-style UI with green terminal theme
- Real-time updates via React Query

### Memory Viewer (`/agent-memory-viewer`)
Specialized viewer for exploring agent memory stored on DSN:
- Browse chronological memory entries
- View detailed decision-making process
- Explore tweet context and agent responses
- Navigate memory chain via CID links
- View conversation threads
- Retro-style UI matching dashboard theme

## Setup

1. Start ChromaDB:
```
docker pull chromadb/chroma:latest
docker run -d -p 8000:8000 chromadb/chroma:latest
```

2. Start the agent service:
```
cd agent
yarn install
cp .env.sample .env  # Configure your credentials
yarn dev
```

3. Start the dashboard:
```
cd frontend
yarn install
cp .env.sample .env
yarn dev
```

4. Start the memory viewer:
```
cd agent-memory-viewer
yarn install
cp .env.sample .env
yarn dev
```

## License

MIT 