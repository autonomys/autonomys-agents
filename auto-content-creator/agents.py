from autogen.agentchat import AssistantAgent
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class ArticleGeneratorAgent(AssistantAgent):
    def __init__(self):
        super().__init__(
            name="ArticleGenerator",
            system_message="You are an expert in web3 technologies and content creation. Your task is to generate informative and engaging article drafts on trending web3 topics.",
            llm_config={
                "model": "gpt-4",
                "temperature": 0.7,
                "max_tokens": 1500,
                "api_key": os.getenv("OPENAI_API_KEY"),
            }
        )

    def generate(self, topic):
        prompt = f"""
        Write a comprehensive article draft on the following web3 topic: {topic}
        
        Include the following sections:
        1. Introduction
        2. Background
        3. Current Developments
        4. Potential Impact
        5. Challenges and Considerations
        6. Conclusion
        
        Ensure the content is informative, well-structured, and engaging for a web3-savvy audience.
        """
        response = self.initiate_chat(self, message=prompt)
        return response.content if response else "Error: No response generated"

