import os
import requests
import logging
from autogen.agentchat import AssistantAgent, ConversableAgent
from config import llm_config_4o, SERPAPI_API_KEY

logging.basicConfig(level=logging.INFO)


def web_search(query):
    logging.info(f"Performing web search for query: {query}")
    url = "https://serpapi.com/search"
    params = {"api_key": SERPAPI_API_KEY, "engine": "google", "q": query, "num": 5}
    if SERPAPI_API_KEY:
        # Log the API key (first 5 characters) being used
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


def create_article_generator_agent():
    return AssistantAgent(
        name="ArticleGenerator",
        system_message=(
            "You are an expert in web3 technologies and content creation. "
            "Your task is to generate informative and engaging article drafts on trending web3 topics."
        ),
        llm_config=llm_config_4o,
        human_input_mode="NEVER",
        max_consecutive_auto_reply=1,
    )


def create_fact_checker_agent():
    return AssistantAgent(
        name="FactChecker",
        system_message=(
            "You are an AI assistant specialized in fact-checking and verification. "
            "Your task is to analyze the provided article content, verify the factual accuracy "
            "using web search, and highlight any discrepancies or confirm correctness. "
            "Always use the 'web_search' function to verify information. "
            "After fact-checking, provide a summary of your findings. "
            "Your fact-checking process should include the following steps:\n"
            "1. Identify key claims or statements in the article.\n"
            "2. Use the web_search function to verify each claim.\n"
            "3. Compare the search results with the article's content.\n"
            "4. Highlight any discrepancies or inaccuracies found.\n"
            "5. Provide a summary of your findings, including both correct and incorrect information.\n"
            "6. End your report with 'Fact-checking complete.' when you've finished the process."
        ),
        llm_config={
            **llm_config_4o,
            "functions": [
                {
                    "name": "web_search",
                    "description": "Search the web for information.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "The search query.",
                            }
                        },
                        "required": ["query"],
                    },
                }
            ],
            "function_call": "auto",
        },
    )


def generate_article(topic):
    manager_agent = ConversableAgent(
        name="Manager",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=0,  # Prevent auto-replies from the manager
    )
    article_agent = create_article_generator_agent()
    fact_checker_agent = create_fact_checker_agent()

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

    # Manager requests the article from ArticleGenerator
    logging.info("Requesting article from ArticleGenerator")
    article_result = manager_agent.initiate_chat(
        recipient=article_agent,
        message=prompt,
    )
    # Extract the content from the ChatResult object
    article_content = (
        article_result.chat_history[-1]["content"]
        if article_result.chat_history
        else str(article_result)
    )

    if (
        not article_content
        or isinstance(article_content, str)
        and article_content.startswith("Error")
    ):
        logging.error("No article generated or error in generation")
        return (
            "Error: No article generated",
            "No fact-check performed due to article generation error.",
        )

    logging.info("Article generated successfully")

    # Manager sends the article to FactChecker for verification
    logging.info("Sending article to FactChecker for verification")
    try:
        fact_check_report = ""
        chat_messages = [
            {
                "role": "user",
                "content": f"Please fact-check the following article:\n\n{article_content}",
            }
        ]

        for _ in range(5):  # Limit the number of iterations to prevent infinite loops
            response = fact_checker_agent.generate_reply(messages=chat_messages)
            if response is None:
                logging.error("generate_reply returned None")
                break

            if isinstance(response, dict):
                response_content = response.get("content")
                function_call = response.get("function_call")
            else:
                response_content = response
                function_call = None

            if function_call:
                function_name = function_call.get("name")
                arguments = function_call.get("arguments")
                if function_name == "web_search":
                    query = eval(arguments).get("query")
                    search_result = web_search(query)
                    fact_check_report += (
                        f"Web search for '{query}':\n{search_result}\n\n"
                    )
                    chat_messages.append(
                        {
                            "role": "function",
                            "name": "web_search",
                            "content": search_result,
                        }
                    )
            else:
                if response_content:
                    fact_check_report += response_content + "\n\n"
                    chat_messages.append(
                        {"role": "assistant", "content": response_content}
                    )
                break  # Exit the loop if we get a final response

        if not fact_check_report:
            logging.error("No fact-check report generated")
            return article_content, "Error: No fact-check report generated"

        logging.info("Fact-check report generated successfully")

    except Exception as e:
        logging.error(f"Error during fact-checking: {str(e)}")
        fact_check_report = (
            f"Unable to generate fact-check report due to an error: {str(e)}"
        )

    return article_content, fact_check_report


def save_article(topic, article_content, fact_check_report):
    # Create the articles directory if it doesn't exist
    os.makedirs("articles", exist_ok=True)

    # Create file names based on the topic
    article_file_name = f"articles/{topic.replace(' ', '_').lower()}_article.md"
    fact_check_file_name = f"articles/{topic.replace(' ', '_').lower()}_fact_check.md"

    # Write the article content to a file
    with open(article_file_name, "w") as f:
        f.write(article_content or "Error: No article content generated")

    # Write the fact-check report to a separate file
    with open(fact_check_file_name, "w") as f:
        f.write(fact_check_report or "Error: No fact-check report generated")

    return article_file_name, fact_check_file_name
