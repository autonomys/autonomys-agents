import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL")

llm_config = {
    "model": OPENAI_MODEL,
    "temperature": 0.7,
    "max_tokens": 10000,
    "api_key": OPENAI_API_KEY,
}
