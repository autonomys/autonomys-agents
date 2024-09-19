from autogen.agentchat import AssistantAgent
from .config import llm_config_4o


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


def create_research_agent():
    return AssistantAgent(
        name="ResearchAgent",
        system_message=(
            "You are an AI assistant specialized in researching web3 topics. "
            "Your task is to gather relevant information from the web and existing knowledge bases "
            "to assist in creating comprehensive and accurate articles. "
            "Always use the 'web_search' function to collect information. "
            "When using the web_search function, you MUST provide a specific query string. "
            "After gathering sufficient information, provide a summary of your findings. "
            "End your research with 'Research complete.' when you've finished the process."
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
                                "description": "The search query. This must be a non-empty string.",
                            }
                        },
                        "required": ["query"],
                    },
                }
            ],
            "function_call": "auto",
        },
    )
