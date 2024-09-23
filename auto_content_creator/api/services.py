from content_creation.article_generator import generate_article, save_article
import uuid
import asyncpg
import os
from typing import Optional
from dotenv import load_dotenv
from content_creation.article_generator import revise_article_with_feedback

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@localhost:5432/auto_content_creator"
)


async def get_db_pool():
    return await asyncpg.create_pool(DATABASE_URL)


async def generate_article_service(
    category: str,
    topic: str,
    pool,
    feedback: Optional[str] = None,
    article_id: Optional[str] = None,
):
    if not article_id:
        article_id = str(uuid.uuid4())

    async with pool.acquire() as conn:
        # Check if the article already exists
        article_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM articles WHERE id = $1)", uuid.UUID(article_id)
        )

        if not article_exists:
            # Create the main article entry if it doesn't exist
            await conn.execute(
                """
                INSERT INTO articles (id, category, topic, title, content)
                VALUES ($1, $2, $3, $4, $5)
                """,
                uuid.UUID(article_id),
                category,
                topic,
                "Untitled",  # We'll update this later
                "Content pending",  # We'll update this later
            )

        # Fetch the latest draft number for the article
        draft_number = await conn.fetchval(
            "SELECT COALESCE(MAX(draft_number), 0) + 1 FROM article_drafts WHERE article_id = $1",
            uuid.UUID(article_id),
        )

    previous_draft_content = ""
    if draft_number > 1:
        async with pool.acquire() as conn:
            previous_draft_content = await conn.fetchval(
                """
                SELECT content FROM article_drafts 
                WHERE article_id = $1 AND draft_number = $2
                """,
                uuid.UUID(article_id),
                draft_number - 1,
            )

    if feedback:
        # Revise the article based on feedback
        (
            title,
            article_content,
            fact_check_report,
            research_info,
            final_article_content,
        ) = revise_article_with_feedback(
            category, topic, previous_draft_content, feedback
        )
    else:
        # Generate a new article
        (
            title,
            article_content,
            fact_check_report,
            research_info,
            final_article_content,
        ) = generate_article(category, topic)

    async with pool.acquire() as conn:
        # Update the main article entry
        await conn.execute(
            """
            UPDATE articles
            SET title = $1, content = $2, fact_check_report = $3, research_info = $4, final_content = $5
            WHERE id = $6
            """,
            title,
            article_content,
            fact_check_report,
            research_info,
            final_article_content,
            uuid.UUID(article_id),
        )

        # Insert the new draft
        await conn.execute(
            """
            INSERT INTO article_drafts (id, article_id, draft_number, content, feedback)
            VALUES ($1, $2, $3, $4, $5)
            """,
            str(uuid.uuid4()),
            uuid.UUID(article_id),
            draft_number,
            final_article_content,
            feedback,
        )

    return {
        "article_id": article_id,
        "draft_number": draft_number,
        "category": category,
        "topic": topic,
        "title": title,
        "article_content": article_content,
        "fact_check_report": fact_check_report,
        "research_info": research_info,
        "final_article_content": final_article_content,
    }


async def get_article_service(article_id: str, pool):
    async with pool.acquire() as conn:
        article = await conn.fetchrow(
            "SELECT * FROM articles WHERE id = $1", uuid.UUID(article_id)
        )

    if article:
        return {
            "article_id": str(article["id"]),
            "category": article["category"],
            "topic": article["topic"],
            "title": article["title"],
            "content": article["content"],
            "fact_check_report": article["fact_check_report"],
            "research_info": article["research_info"],
            "final_article_content": article["final_content"],
            "created_at": article["created_at"].isoformat(),
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
        # Create articles table
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id UUID PRIMARY KEY,
                category TEXT NOT NULL,
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

        # Create article_drafts table
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS article_drafts (
                id UUID PRIMARY KEY,
                article_id UUID REFERENCES articles(id),
                draft_number INT NOT NULL,
                content TEXT NOT NULL,
                feedback TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


async def get_article_drafts_service(article_id: str, pool):
    async with pool.acquire() as conn:
        drafts = await conn.fetch(
            "SELECT draft_number, content, feedback, created_at FROM article_drafts WHERE article_id = $1 ORDER BY draft_number",
            uuid.UUID(article_id),
        )

    if drafts:
        return [
            {
                "draft_number": draft["draft_number"],
                "content": draft["content"],
                "feedback": draft["feedback"],
                "created_at": draft["created_at"].isoformat(),
            }
            for draft in drafts
        ]
    return None
