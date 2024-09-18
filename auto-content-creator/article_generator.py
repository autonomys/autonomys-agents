import argparse
import logging
from typing import List, Dict
from dotenv import load_dotenv
import os

from agents import ArticleGeneratorAgent

class ArticleGenerator:
    def __init__(self):
        load_dotenv()  # Load environment variables from .env file
        self.agent = ArticleGeneratorAgent()
        self.logger = logging.getLogger(__name__)

    def get_trending_topics(self) -> List[str]:
        # TODO: Implement a real API call or web scraping logic
        self.logger.info("Fetching trending web3 topics")
        return ["DeFi innovations", "NFT use cases", "Layer 2 scaling solutions"]

    def generate_article(self, topic: str) -> Dict[str, str]:
        self.logger.info(f"Generating article for topic: {topic}")
        content = self.agent.generate(topic)
        return {"topic": topic, "content": content}

    def run(self, topic: str = None) -> List[Dict[str, str]]:
        if topic:
            topics = [topic]
        else:
            topics = self.get_trending_topics()

        articles = []
        for t in topics:
            try:
                article = self.generate_article(t)
                articles.append(article)
            except Exception as e:
                self.logger.error(f"Error generating article for topic '{t}': {str(e)}")
        return articles

def main():
    parser = argparse.ArgumentParser(description="Generate web3 article drafts")
    parser.add_argument("--topic", type=str, help="Specific topic to write about")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    generator = ArticleGenerator()
    generated_articles = generator.run(args.topic)
    
    print(f"Generated {len(generated_articles)} article draft(s).")
    for article in generated_articles:
        print(f"\nTopic: {article['topic']}")
        print(f"Content preview: {article['content'][:200]}...")
        print("---")

if __name__ == "__main__":
    main()