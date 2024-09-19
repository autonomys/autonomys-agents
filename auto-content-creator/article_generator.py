import os
import logging
import json
from autogen.agentchat import ConversableAgent
from agents import (
    create_article_generator_agent,
    create_fact_checker_agent,
    create_research_agent,
)
from web_search import web_search

logging.basicConfig(level=logging.INFO)


def generate_draft(topic, manager_agent, article_agent, research_info):
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
    
    Utilize the following research information to enhance the article:

    {research_info}
    """

    # Manager requests the article from ArticleGenerator
    logging.info("Requesting article from ArticleGenerator")
    try:
        article_result = manager_agent.initiate_chat(
            recipient=article_agent,
            message=prompt,
        )

        # Extract the content from the ChatResult object
        if article_result.chat_history and "content" in article_result.chat_history[-1]:
            article_content = article_result.chat_history[-1]["content"]
        else:
            article_content = str(article_result)

        if not article_content or (
            isinstance(article_content, str) and article_content.startswith("Error")
        ):
            logging.error("No article generated or error in generation")
            return "Error: No article generated"

        logging.info("Article generated successfully")
        return article_content

    except Exception as e:
        error_msg = f"Error during draft generation: {str(e)}"
        logging.error(error_msg)
        return f"Error: {error_msg}"


def execute_agent_with_function_calling(agent, initial_message, max_iterations=5):
    chat_messages = [{"role": "user", "content": initial_message}]
    result_content = ""
    sources = []

    for _ in range(max_iterations):
        response = agent.generate_reply(messages=chat_messages)
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
            logging.info(f"Function call: {function_name}, Arguments: {arguments}")

            if function_name == "web_search":
                if isinstance(arguments, str):
                    try:
                        arguments = json.loads(arguments)
                    except json.JSONDecodeError:
                        logging.error(f"Failed to parse arguments: {arguments}")
                        continue

                query = arguments.get("query") if isinstance(arguments, dict) else None
                if query:
                    logging.info(f"Executing web_search for query: {query}")
                    search_results = web_search(query)
                    if isinstance(search_results, list):
                        search_content = "\n".join(
                            [
                                f"Title: {r['title']}\nSnippet: {r['snippet']}\nSource: {r['link']}"
                                for r in search_results
                            ]
                        )
                        sources.extend([r["link"] for r in search_results])
                    else:
                        search_content = search_results
                    logging.info(
                        f"Web search result: {search_content[:100]}..."
                    )  # Log first 100 chars

                    chat_messages.append(
                        {
                            "role": "function",
                            "name": "web_search",
                            "content": search_content or "No results found.",
                        }
                    )
                else:
                    logging.error("No 'query' found in function call arguments.")
                    chat_messages.append(
                        {
                            "role": "function",
                            "name": "web_search",
                            "content": "Error: No query provided for web search. Please provide a specific search query.",
                        }
                    )
            else:
                logging.warning(f"Unknown function '{function_name}' called.")
        elif response_content:
            logging.info(
                f"Content received: {response_content[:100]}..."
            )  # Log first 100 chars
            result_content += response_content + "\n"
            chat_messages.append({"role": "assistant", "content": response_content})
            if "complete" in response_content.lower():
                logging.info("Completion signal received.")
                break
        else:
            logging.warning("Assistant's response has no content or function call.")

    return result_content.strip(), sources


def conduct_research(topic, research_agent):
    prompt = f"""
    Please research the following topic: {topic}
    Gather relevant information from credible sources about this topic using 'web_search'.
    Provide a summary of your findings, including key points, current trends, and any controversies or debates surrounding the topic.
    After gathering information, please provide a final summary of your research.
    Include the sources used in your research at the end of your report.
    To use the web_search function, you must provide a query string.
    End your research with 'Research complete.' when you've finished the process.
    """
    logging.info(f"Conducting research on the topic: {topic}")

    research_content, sources = execute_agent_with_function_calling(
        research_agent, prompt
    )

    if not research_content:
        logging.error("No research content generated")
        return "Error: No research information gathered"

    # Append sources to the research content
    research_content += "\n\nSources:\n" + "\n".join(sources)

    logging.info("Research information gathered successfully")
    return research_content


def fact_check_article(article_content, fact_checker_agent):
    logging.info("Sending article to FactChecker for verification")
    prompt = f"""
    Please fact-check the following article:

    {article_content}

    Provide a summary of your findings, including any discrepancies or inaccuracies found.
    Include the sources used in your fact-checking at the end of your report.
    """

    fact_check_report, sources = execute_agent_with_function_calling(
        fact_checker_agent, prompt
    )

    if not fact_check_report:
        logging.error("No fact-check report generated")
        return "Error: No fact-check report generated"

    # Append sources to the fact-check report
    fact_check_report += "\n\nSources:\n" + "\n".join(sources)

    logging.info("Fact-check report generated successfully")
    return fact_check_report


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
    if (
        revised_article_result.chat_history
        and "content" in revised_article_result.chat_history[-1]
    ):
        final_article_content = revised_article_result.chat_history[-1]["content"]
    else:
        final_article_content = str(revised_article_result)

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
    research_agent = create_research_agent()

    # Get research information
    research_info = conduct_research(topic, research_agent)

    if research_info.startswith("Error"):
        logging.error(f"Research failed: {research_info}")
        return research_info, "", "", ""  # Return early if research fails

    # Generate the article draft using the research information
    article_content = generate_draft(topic, manager_agent, article_agent, research_info)

    if article_content.startswith("Error"):
        logging.error(f"Draft generation failed: {article_content}")
        return (
            article_content,
            "No fact-check performed due to draft generation error.",
            research_info,
            "",
        )

    # Proceed with fact-checking and revision
    fact_check_report = fact_check_article(article_content, fact_checker_agent)
    final_article_content = revise_article(
        article_content, fact_check_report, manager_agent, article_agent
    )

    return (
        article_content,
        fact_check_report,
        research_info,
        final_article_content,
    )


def save_article(
    topic, article_content, fact_check_report, final_article_content, research_info
):
    articles_dir = "articles"
    os.makedirs(articles_dir, exist_ok=True)

    # Create file names based on the topic
    safe_topic = topic.replace(" ", "_").lower()
    article_file_name = os.path.join(articles_dir, f"{safe_topic}_draft.md")
    fact_check_file_name = os.path.join(articles_dir, f"{safe_topic}_fact_check.md")
    research_file_name = os.path.join(articles_dir, f"{safe_topic}_research.md")
    final_article_file_name = os.path.join(articles_dir, f"{safe_topic}_final.md")

    # Write the article draft to a file
    with open(article_file_name, "w") as f:
        f.write(article_content or "Error: No article draft generated")

    # Write the fact-check report to a separate file
    with open(fact_check_file_name, "w") as f:
        f.write(fact_check_report or "Error: No fact-check report generated")

    # Write the research report to a separate file
    with open(research_file_name, "w") as f:
        f.write(research_info or "Error: No research information generated")

    # Write the final article to a file
    with open(final_article_file_name, "w") as f:
        f.write(final_article_content or "Error: No final article generated")

    return (
        article_file_name,
        fact_check_file_name,
        research_file_name,
        final_article_file_name,
    )
