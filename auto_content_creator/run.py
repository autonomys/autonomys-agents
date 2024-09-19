import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uvicorn
from auto_content_creator.api.app import app
from auto_content_creator.api.services import get_db_pool


async def init_db(pool):
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id UUID PRIMARY KEY,
                topic TEXT NOT NULL,
                content TEXT NOT NULL,
                fact_check_report TEXT,
                research_info TEXT,
                final_content TEXT,
                article_file TEXT,
                fact_check_file TEXT,
                research_file TEXT,
                final_article_file TEXT
            )
        """
        )


async def startup():
    app.state.pool = await get_db_pool()
    await init_db(app.state.pool)


async def shutdown():
    await app.state.pool.close()


if __name__ == "__main__":
    app.add_event_handler("startup", startup)
    app.add_event_handler("shutdown", shutdown)
    config = uvicorn.Config(app, host="0.0.0.0", port=8000)
    server = uvicorn.Server(config)
    server.run()
