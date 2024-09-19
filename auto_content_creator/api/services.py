from auto_content_creator.content_creation.article_generator import (
    generate_article,
    save_article,
)
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
    article_content, fact_check_report, research_info, final_article_content = (
        generate_article(topic)
    )

    article_id = str(uuid.uuid4())
    article_file, fact_check_file, research_file, final_article_file = save_article(
        topic,
        article_content,
        fact_check_report,
        final_article_content,
        research_info,
    )

    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO articles (id, topic, content, fact_check_report, research_info, final_content, article_file, fact_check_file, research_file, final_article_file)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        """,
            article_id,
            topic,
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
            "SELECT * FROM articles WHERE id = $1", article_id
        )

    if article:
        return {
            "article_id": article["id"],
            "topic": article["topic"],
            "article_content": article["content"],
            "fact_check_report": article["fact_check_report"],
            "research_info": article["research_info"],
            "final_article_content": article["final_content"],
            "files": {
                "article": article["article_file"],
                "fact_check": article["fact_check_file"],
                "research": article["research_file"],
                "final_article": article["final_article_file"],
            },
        }
    return None  # Article not found
