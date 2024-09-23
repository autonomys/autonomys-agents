from fastapi import FastAPI, BackgroundTasks, Request, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse  # type: ignore
from pydantic import BaseModel
from .services import (
    generate_article_service,
    get_article_service,
    get_db_pool,
    init_db,
    get_article_drafts_service,
)
import asyncio
import uuid
import json
from fastapi.encoders import jsonable_encoder
from typing import List
from datetime import datetime
from typing import Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Add any other origins you need
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ArticleRequest(BaseModel):
    category: str
    topic: str


@app.post("/generate-article")
async def generate_article(
    article_request: ArticleRequest, background_tasks: BackgroundTasks
):
    article_id = str(uuid.uuid4())
    background_tasks.add_task(
        process_article_generation,
        article_request.category,
        article_request.topic,
        article_id,
    )
    return {"article_id": article_id}


@app.get("/article/{article_id}")
async def get_article(article_id: str):
    article = await get_article_service(article_id, app.state.pool)
    if article:
        return article
    raise HTTPException(status_code=404, detail="Article not found")


async def process_article_generation(
    category: str, topic: str, article_id: str, feedback: Optional[str] = None
):
    result = await generate_article_service(
        category, topic, app.state.pool, feedback, article_id
    )
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
    app.state.pool = await get_db_pool()
    await init_db(app.state.pool)
    app.state.article_results = {}


class ArticleSummary(BaseModel):
    id: uuid.UUID  # Change this to uuid.UUID
    title: str
    created_at: datetime


@app.get("/articles", response_model=dict)  # Change response_model to dict
async def get_articles(
    page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100)
):
    offset = (page - 1) * page_size
    async with app.state.pool.acquire() as conn:
        articles = await conn.fetch(
            """
            SELECT id, title, created_at
            FROM articles
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            """,
            page_size,
            offset,
        )
        total_count = await conn.fetchval("SELECT COUNT(*) FROM articles")

    return {
        "articles": [
            {
                "id": str(row["id"]),  # Convert UUID to string
                "title": row["title"],
                "created_at": row[
                    "created_at"
                ].isoformat(),  # Convert datetime to ISO format string
            }
            for row in articles
        ],
        "total": total_count,
        "page": page,
        "page_size": page_size,
        "total_pages": -(-total_count // page_size),  # Ceiling division
    }


class FeedbackRequest(BaseModel):
    article_id: str
    feedback: str


@app.post("/submit-feedback")
async def submit_feedback(
    feedback_request: FeedbackRequest, background_tasks: BackgroundTasks
):
    article = await get_article_service(feedback_request.article_id, app.state.pool)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    background_tasks.add_task(
        process_article_generation,
        article["category"],
        article["topic"],
        feedback_request.article_id,
        feedback_request.feedback,
    )
    return {"message": "Feedback submitted successfully"}


@app.get("/article-drafts/{article_id}")
async def get_article_drafts(article_id: str):
    drafts = await get_article_drafts_service(article_id, app.state.pool)
    if drafts:
        return drafts
    raise HTTPException(status_code=404, detail="Drafts not found")
