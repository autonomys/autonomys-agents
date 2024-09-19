from auto_content_creator.content_creation.article_generator import (
    generate_article,
    save_article,
)
import uuid


async def generate_article_service(topic: str):
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


async def get_article_service(article_id: str):
    # Implement logic to retrieve article by ID
    # This is a placeholder and needs to be implemented based on your storage mechanism
    pass
