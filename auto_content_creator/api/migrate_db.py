import asyncio
import asyncpg
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get the DATABASE_URL from environment variables
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://user:password@localhost:5432/auto_content_creator"
)


async def migrate_db():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Migrate articles table
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

        # Add new columns to articles table if they don't exist
        columns_to_add = [
            ("category", "TEXT"),
            ("title", "TEXT"),
            ("created_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
        ]

        for column_name, column_type in columns_to_add:
            column_exists = await conn.fetchval(
                f"""
                SELECT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name='articles' AND column_name='{column_name}'
                )
                """
            )
            if not column_exists:
                await conn.execute(
                    f"""
                    ALTER TABLE articles
                    ADD COLUMN {column_name} {column_type}
                    """
                )
                print(f"'{column_name}' column added to the 'articles' table.")

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
        print("'article_drafts' table created or already exists.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate_db())
