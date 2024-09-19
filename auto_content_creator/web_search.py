import requests
import logging
from config import SERPAPI_API_KEY


def web_search(query):
    logging.info(f"Performing web search for query: {query}")
    url = "https://serpapi.com/search"
    params = {"api_key": SERPAPI_API_KEY, "engine": "google", "q": query, "num": 5}

    if not SERPAPI_API_KEY:
        logging.error("SERPAPI_API_KEY is not set.")
        return "Error: SERPAPI_API_KEY is not set."

    try:
        response = requests.get(url, params=params)
        logging.info(f"Response status code: {response.status_code}")

        response.raise_for_status()
        results = response.json().get("organic_results", [])

        if not results:
            logging.warning("No results found in the API response")
            return "No results found"

        search_results = []
        for r in results:
            result = {
                "title": r.get("title", ""),
                "snippet": r.get("snippet", ""),
                "link": r.get("link", ""),
            }
            search_results.append(result)

        logging.info(f"Web search results: {search_results[:2]}")  # Log first 2 results
        return search_results
    except requests.RequestException as e:
        error_msg = f"Error: Unable to perform web search. {str(e)}"
        logging.error(error_msg)
        if hasattr(e, "response") and e.response is not None:
            logging.error(f"Response text: {e.response.text}")
        return error_msg
