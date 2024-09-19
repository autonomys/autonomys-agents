from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from .services import generate_article_service, get_article_service

app = FastAPI()


class GenerateArticleRequest(BaseModel):
    topic: str


@app.post("/generate-article")
async def generate_article_endpoint(
    request: GenerateArticleRequest, background_tasks: BackgroundTasks
):
    background_tasks.add_task(process_article_generation, request.topic)
    return {
        "status": "processing",
        "message": f"Article generation started for topic: {request.topic}",
    }


@app.get("/articles/{article_id}")
async def get_article(article_id: str):
    article = await get_article_service(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


async def process_article_generation(topic: str):
    await generate_article_service(topic)
