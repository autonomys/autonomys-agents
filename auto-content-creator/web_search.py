import requests
import logging
from config import SERPAPI_API_KEY


def web_search(query):
    logging.info(f"Performing web search for query: {query}")
    url = "https://serpapi.com/search"
    params = {"api_key": SERPAPI_API_KEY, "engine": "google", "q": query, "num": 5}
    if SERPAPI_API_KEY:
        logging.info(f"Using SERPAPI_API_KEY: {SERPAPI_API_KEY[:5]}...")
    else:
        logging.error("SERPAPI_API_KEY is not set.")
        return "Error: SERPAPI_API_KEY is not set."

    try:
        response = requests.get(url, params=params)
        logging.info(f"Response status code: {response.status_code}")
        logging.info(f"Response headers: {response.headers}")

        response.raise_for_status()
        results = response.json().get("organic_results", [])
        search_results = "\n".join([f"{r['title']}: {r['snippet']}" for r in results])
        logging.info(f"Web search results: {search_results}")
        return search_results
    except requests.RequestException as e:
        error_msg = f"Error: Unable to perform web search. {str(e)}"
        logging.error(error_msg)
        if e.response is not None and hasattr(e.response, "text"):
            logging.error(f"Response text: {e.response.text}")
        return error_msg
