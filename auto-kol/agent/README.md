
# Auto-KOL: AI Agent Campaign Framework for Twitter Engagement

Auto-KOL is an intelligent agent framework designed to engage with thought leaders (Key Opinion Leaders) on Twitter through automated, context-aware interactions.

## Features

- Automated tweet monitoring and response generation
- Multi-step workflow with engagement decision making
- Tone analysis and adaptive response strategies
- Human-in-the-loop approval system (for now)
- Rate limit handling and queue management
- Extensible agent architecture

## Prerequisites

- Node.js (v16 or higher)
- Twitter API credentials
- OpenAI API key

## Installation

1. Clone the repository:
`git clone https://github.com/yourusername/auto-kol.git`

2. Install dependencies:
`npm install`

3. Configure environment variables:
`cp .env.sample .env`

Edit `.env` with your credentials:
```
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
OPENAI_API_KEY=your_openai_api_key
```

## Usage

1. Start the development server:
`yarn dev`

2. Build for production:
`yarn build`

3. Start production server:
`yarn start`

## API Endpoints

### Health Check
- GET `/health`

### Response Management
- GET `/responses/pending` - Get all pending responses
- POST `/responses/:id/approve` - Approve/reject a response
- GET `/responses/:id/workflow` - Get workflow state for a response

### Tweet Management
- GET `/tweets/skipped` - Get all skipped tweets
- GET `/tweets/skipped/:id` - Get specific skipped tweet
- POST `/tweets/skipped/:id/queue` - Move skipped tweet to response queue

## Architecture

The system follows a multi-stage workflow:

1. Tweet Monitoring
2. Engagement Decision
3. Tone Analysis
4. Response Generation
5. Human Review
6. Response Execution

## Configuration

Key configuration options in `.env`:

- `TARGET_ACCOUNTS`: Twitter handles to monitor
- `CHECK_INTERVAL`: Monitoring frequency
- `LLM_MODEL`: Language model selection
- `NODE_ENV`: Environment setting

## ChromaDB

ChromaDB is used as a vector database to store tweet embeddings. First, pull the docker image:
`docker pull chroma/chroma:latest`

Then, run the docker container:
`docker run -d -p 8000:8000 chroma/chroma:latest`

## License


MIT