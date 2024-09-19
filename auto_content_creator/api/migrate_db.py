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
        # Check if the title column exists
        title_exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='articles' AND column_name='title'
            )
        """
        )

        if not title_exists:
            print("Adding 'title' column to the 'articles' table...")
            await conn.execute(
                """
                ALTER TABLE articles
                ADD COLUMN title TEXT NOT NULL DEFAULT 'Untitled Article'
            """
            )
            print("'title' column added successfully.")
        else:
            print("'title' column already exists in the 'articles' table.")

        # Check if the created_at column exists
        created_at_exists = await conn.fetchval(
            """
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_name='articles' AND column_name='created_at'
            )
        """
        )

        if not created_at_exists:
            print("Adding 'created_at' column to the 'articles' table...")
            await conn.execute(
                """
                ALTER TABLE articles
                ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            """
            )
            print("'created_at' column added successfully.")
        else:
            print("'created_at' column already exists in the 'articles' table.")

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(migrate_db())
