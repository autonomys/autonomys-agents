from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse  # type: ignore
from pydantic import BaseModel
from .services import generate_article_service, get_article_service
import asyncio
import uuid
import json
from fastapi.encoders import jsonable_encoder

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Topic(BaseModel):
    topic: str


@app.post("/generate-article")
async def generate_article(topic: Topic, background_tasks: BackgroundTasks):
    article_id = str(uuid.uuid4())
    background_tasks.add_task(process_article_generation, topic.topic, article_id)
    return {"article_id": article_id}


@app.get("/article/{article_id}")
async def get_article(article_id: str):
    article = await get_article_service(article_id, app.state.pool)
    if article:
        return article
    return {"error": "Article not found"}


async def process_article_generation(topic: str, article_id: str):
    result = await generate_article_service(topic, app.state.pool)
    # Store the result in a way that can be accessed by the SSE endpoint
    # For simplicity, we'll use a global variable here, but in a real application,
    # you might want to use a proper caching solution or database
    app.state.article_results[article_id] = result


@app.get("/article-status/{article_id}")
async def article_status(request: Request, article_id: str):
    async def event_generator():
        while True:
            if await request.is_disconnected():
                break

            if article_id in app.state.article_results:
                result = app.state.article_results[article_id]
                json_compatible_result = jsonable_encoder(result)
                yield {
                    "event": "article_ready",
                    "data": json.dumps(json_compatible_result),
                }
                break

            yield {
                "event": "processing",
                "data": json.dumps("Article is being generated..."),
            }
            await asyncio.sleep(2)

    return EventSourceResponse(event_generator())


# Initialize article_results in app.state
@app.on_event("startup")
async def startup_event():
    app.state.article_results = {}
