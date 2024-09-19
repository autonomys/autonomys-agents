import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY")  # Add this line

llm_config_4o = {
    "model": "gpt-4o-mini",
    "temperature": 0.7,
    "max_tokens": 4096,
    "api_key": OPENAI_API_KEY,
}

llm_config_o1 = {
    "model": "o1-preview",
    "temperature": 0.7,
    "max_tokens": 4096,
    "api_key": OPENAI_API_KEY,
}
