# Auto Content Creator

Auto Content Creator is a web application that generates articles on specified web3topics using AI. It includes a backend API built with FastAPI and a frontend interface built with React.

## Features

- Generate articles on any given web3 topic
- View a list of previously generated articles
- Read detailed views of generated articles, including fact-check reports and research information
- Responsive web interface

## Prerequisites

- Docker and Docker Compose
- Git

## Setup and Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/auto_content_creator.git
   cd auto_content_creator
   ```

2. Create a `.env` file in the root directory and add the following environment variables:

   ```
   OPENAI_API_KEY=your_openai_api_key
   SERPAPI_API_KEY=your_serpapi_api_key
   POSTGRES_DB=auto_content_creator
   POSTGRES_USER=your_db_user
   POSTGRES_PASSWORD=your_db_password
   POSTGRES_PORT=5432
   BACKEND_PORT=8000
   FRONTEND_PORT=3000
   ```

   Replace `your_openai_api_key`, `your_serpapi_api_key`, `your_db_user`, and `your_db_password` with your actual values.

3. Build and start the Docker containers:
   ```
   docker-compose up -d --build
   ```

## Usage

1. Open your web browser and go to `http://localhost:3000` (or whatever port you specified for FRONTEND_PORT).
2. Use the "Generate Article" page to create new articles.
3. View the list of generated articles on the "Existing Articles" page.
4. Click on an article to view its full content, including fact-check and research information.

## API Endpoints

The backend API is available at `http://localhost:8000` (or whatever port you specified for BACKEND_PORT). Here are the main endpoints:

- `POST /generate-article`: Generate a new article
- `GET /article/{article_id}`: Get a specific article
- `GET /articles`: Get a list of all articles

For more detailed API documentation, visit `http://localhost:8000/docs` when the backend is running.

## Development

To develop the project locally without Docker:

1. Set up a virtual environment for the backend:

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

2. Run the database:

   ```
   docker-compose up -d db
   ```

3. Run the backend:

   ```
   python run.py
   ```

4. Set up the frontend:

   ```
   cd frontend
   yarn install
   ```

5. Run the frontend:
   ```
   yarn dev
   ```

## Project Status

This project is in its early experimental stages. We are actively exploring concepts, testing ideas, and iterating on designs. As such, the codebase and documentation may change rapidly and significantly.

Future plans include integrating with the Autonomys Network for article storage and provenance.

## Disclaimer

This is a highly experimental project. Concepts and implementations are subject to change. Use at your own risk.
