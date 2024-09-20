from content_creation.article_generator import generate_article, save_article
import uuid
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@localhost:5432/auto_content_creator"
)


async def get_db_pool():
    return await asyncpg.create_pool(DATABASE_URL)


async def generate_article_service(topic: str, pool):
    title, article_content, fact_check_report, research_info, final_article_content = (
        generate_article(topic)
    )

    article_id = str(uuid.uuid4())
    title_str = str(title) if title else ""
    article_file, fact_check_file, research_file, final_article_file = save_article(
        topic,
        title_str,
        article_content,
        fact_check_report,
        final_article_content,
        research_info,
    )

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO articles (id, topic, title, content, fact_check_report, research_info, final_content, article_file, fact_check_file, research_file, final_article_file)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        """,
            article_id,
            topic,
            title,
            article_content,
            fact_check_report,
            research_info,
            final_article_content,
            article_file,
            fact_check_file,
            research_file,
            final_article_file,
        )

    return {
        "article_id": article_id,
        "title": title,
        "article_content": article_content,
        "fact_check_report": fact_check_report,
        "research_info": research_info,
        "final_article_content": final_article_content,
        "files": {
            "article": article_file,
            "fact_check": fact_check_file,
            "research": research_file,
            "final_article": final_article_file,
        },
    }


async def get_article_service(article_id: str, pool):
    async with pool.acquire() as conn:
        article = await conn.fetchrow(
            "SELECT * FROM articles WHERE id = $1", uuid.UUID(article_id)
        )

    if article:
        return {
            "article_id": str(article["id"]),  # Convert UUID to string
            "topic": article["topic"],
            "title": article["title"],  # Add this line
            "content": article["content"],
            "fact_check_report": article["fact_check_report"],
            "research_info": article["research_info"],
            "final_article_content": article["final_content"],
            "created_at": article["created_at"].isoformat(),  # Add this line
            "files": {
                "article": article["article_file"],
                "fact_check": article["fact_check_file"],
                "research": article["research_file"],
                "final_article": article["final_article_file"],
            },
        }
    return None  # Article not found


async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id UUID PRIMARY KEY,
                topic TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                fact_check_report TEXT,
                research_info TEXT,
                final_content TEXT,
                article_file TEXT,
                fact_check_file TEXT,
                research_file TEXT,
                final_article_file TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """
        )


# # Add this to your startup event in app.py
# @app.on_event("startup")
# async def startup_event():
#     app.state.pool = await get_db_pool()
#     await init_db(app.state.pool)
#     app.state.article_results = {}
