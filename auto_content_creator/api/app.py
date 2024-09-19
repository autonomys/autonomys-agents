from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from .services import generate_article_service, get_article_service

app = FastAPI()


class Topic(BaseModel):
    topic: str


@app.post("/generate-article")
@app.post("/generate-article/")
async def generate_article(topic: Topic, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_article_generation, topic.topic)
    return {"message": "Article generation started"}


@app.get("/article/{article_id}")
async def get_article(article_id: str):
    article = await get_article_service(article_id, app.state.pool)
    if article:
        return article
    return {"error": "Article not found"}


async def process_article_generation(topic: str):
    result = await generate_article_service(topic, app.state.pool)
    # You can add additional processing here if needed
    print(f"Article generated for topic: {topic}")
    print(f"Article ID: {result['article_id']}")
