import os
import logging
from autogen.agentchat import ConversableAgent
from agents import create_article_generator_agent, create_fact_checker_agent
from web_search import web_search

logging.basicConfig(level=logging.INFO)


def generate_draft(topic, manager_agent, article_agent):
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
            "",  # Empty string for final_article_content
        )

    logging.info("Article generated successfully")
    return article_content


def fact_check_article(article_content, fact_checker_agent):
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
            return (
                article_content,
                "Error: No fact-check report generated",
                article_content,
            )

        logging.info("Fact-check report generated successfully")
        return fact_check_report

    except Exception as e:
        logging.error(f"Error during fact-checking: {str(e)}")
        fact_check_report = (
            f"Unable to generate fact-check report due to an error: {str(e)}"
        )
        return article_content, fact_check_report, article_content


def revise_article(article_content, fact_check_report, manager_agent, article_agent):
    # Revise the article based on the fact-check report
    logging.info("Revising article based on fact-check report")
    revision_prompt = f"""
    Please revise the following article based on the fact-check report to correct any inaccuracies:

    Original Article:
    {article_content}

    Fact-Check Report:
    {fact_check_report}

    Provide a revised version of the article that incorporates the fact-check findings and corrects any inaccuracies.
    Ensure the revised article maintains its original structure and flow while improving its accuracy.
    """

    # Manager requests the revised article from ArticleGenerator
    revised_article_result = manager_agent.initiate_chat(
        recipient=article_agent,
        message=revision_prompt,
    )

    # Extract the revised article content
    final_article_content = (
        revised_article_result.chat_history[-1]["content"]
        if revised_article_result.chat_history
        else str(revised_article_result)
    )

    if final_article_content.startswith("Error"):
        logging.error("Failed to generate revised article")
        final_article_content = "Error: Unable to generate revised article."

    logging.info("Revised article generated successfully")
    return final_article_content


def generate_article(topic):
    manager_agent = ConversableAgent(
        name="Manager",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=0,  # Prevent auto-replies from the manager
    )
    article_agent = create_article_generator_agent()
    fact_checker_agent = create_fact_checker_agent()

    article_content = generate_draft(topic, manager_agent, article_agent)
    fact_check_report = fact_check_article(article_content, fact_checker_agent)
    final_article_content = revise_article(
        article_content, fact_check_report, manager_agent, article_agent
    )

    return article_content, fact_check_report, final_article_content


def save_article(topic, article_content, fact_check_report, final_article_content):
    articles_dir = "articles"
    os.makedirs(articles_dir, exist_ok=True)

    # Create file names based on the topic
    safe_topic = topic.replace(" ", "_").lower()
    article_file_name = os.path.join(articles_dir, f"{safe_topic}_draft.md")
    fact_check_file_name = os.path.join(articles_dir, f"{safe_topic}_fact_check.md")
    final_article_file_name = os.path.join(articles_dir, f"{safe_topic}_final.md")

    # Write the article draft to a file
    with open(article_file_name, "w") as f:
        f.write(article_content or "Error: No article draft generated")

    # Write the fact-check report to a separate file
    with open(fact_check_file_name, "w") as f:
        f.write(fact_check_report or "Error: No fact-check report generated")

    # Write the final article to a file
    with open(final_article_file_name, "w") as f:
        f.write(final_article_content or "Error: No final article generated")

    return article_file_name, fact_check_file_name, final_article_file_name
