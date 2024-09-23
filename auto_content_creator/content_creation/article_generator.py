import os
import logging
import json
from autogen.agentchat import ConversableAgent
from .agents import (
    create_article_generator_agent,
    create_fact_checker_agent,
    create_research_agent,
)
from .web_search import web_search

logging.basicConfig(level=logging.INFO)


def generate_draft(
    category: str, topic: str, manager_agent, article_agent, research_info
):
    prompt = f"""
    Create an engaging and informative article on the following {category} topic: {topic}

    Use the research information provided to enrich your content:

    {research_info}

    First, analyze the topic and choose the most appropriate writing style from the following options:
    1. Standard Article: A well-structured piece with clear sections and a logical flow.
    2. Narrative Style: A story-driven approach that weaves facts into a compelling narrative.
    3. Problem-Solution: An article that presents a challenge and explores potential solutions.
    4. Debate Style: A balanced presentation of different viewpoints on a controversial topic.
    5. How-To Guide: A step-by-step instructional piece on a process or technique.
    6. List Article: A curated list of items, facts, or tips related to the topic.
    7. Interview Format: A Q&A style article presenting expert opinions or experiences.
    8. Case Study: An in-depth analysis of a specific example or scenario related to the topic.

    Once you've selected the most fitting style, craft your article accordingly. Regardless of the chosen style, ensure your article:
    - Begins with a captivating hook or opening that draws the reader in.
    - Provides necessary background information to set the context.
    - Explores current developments, trends, or key aspects of the topic.
    - Discusses potential impacts, implications, or future scenarios related to the subject.
    - Addresses any relevant challenges, controversies, or differing perspectives.
    - Concludes with thought-provoking insights or a call-to-action that resonates with the reader.

    Feel free to use subheadings, bullet points, or other formatting elements to enhance readability and engagement.

    Tailor your writing style and depth to a {category}-savvy audience, ensuring the content is both informative and compelling.

    Before you begin writing, state the chosen writing style and briefly explain why it's the most appropriate for this topic.
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
    Ensure the revised article maintains its original structure, flow, and chosen writing style while improving its accuracy.
    If the original article stated a specific writing style, make sure to preserve that style in your revision.
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


def revise_article_with_feedback(
    category: str, topic: str, article_content: str, feedback: str
):
    manager_agent = ConversableAgent(
        name="Manager",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=0,
    )
    article_agent = create_article_generator_agent(category)

    revision_prompt = f"""
    Please revise the following article based on the feedback provided:

    Feedback:
    {feedback}

    Original Article:
    {article_content}

    Provide a revised version of the article that incorporates the feedback.
    """

    revised_article_result = manager_agent.initiate_chat(
        recipient=article_agent,
        message=revision_prompt,
    )

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

    # Generate a new title
    title_prompt = (
        f"Generate a concise and engaging title for the revised article about {topic}."
    )
    title = article_agent.generate_reply(
        messages=[{"role": "user", "content": title_prompt}]
    )

    # Return the same number of values as generate_article
    return (
        title,
        article_content,  # Original content
        "",  # No new fact check report
        "",  # No new research info
        final_article_content,
    )


def generate_article(category: str, topic: str):
    manager_agent = ConversableAgent(
        name="Manager",
        human_input_mode="NEVER",
        max_consecutive_auto_reply=0,  # Prevent auto-replies from the manager
    )
    article_agent = create_article_generator_agent(category)
    fact_checker_agent = create_fact_checker_agent(category)
    research_agent = create_research_agent(category)

    # Get research information
    research_info = conduct_research(f"{category}: {topic}", research_agent)

    if research_info.startswith("Error"):
        logging.error(f"Research failed: {research_info}")
        return research_info, "", "", "", ""  # Return early if research fails

    # Generate the article draft using the research information
    article_content = generate_draft(
        category, topic, manager_agent, article_agent, research_info
    )

    if article_content.startswith("Error"):
        logging.error(f"Draft generation failed: {article_content}")
        return (
            "",
            article_content,
            "No fact-check performed due to draft generation error.",
            research_info,
            "",
        )

    # Generate a title for the article
    title_prompt = (
        f"Generate a concise and engaging title for an article about {topic}."
    )
    title = article_agent.generate_reply(
        messages=[{"role": "user", "content": title_prompt}]
    )

    # Proceed with fact-checking and revision
    fact_check_report = fact_check_article(article_content, fact_checker_agent)
    final_article_content = revise_article(
        article_content, fact_check_report, manager_agent, article_agent
    )

    return (
        title,
        article_content,
        fact_check_report,
        research_info,
        final_article_content,
    )


def save_article(
    category: str,
    topic: str,
    title: str,
    article_content: str,
    fact_check_report: str,
    final_article_content: str,
    research_info: str,
):
    base_dir = os.path.join("articles", category.replace(" ", "_").lower())
    os.makedirs(base_dir, exist_ok=True)

    # Create file names based on the topic
    safe_topic = topic.replace(" ", "_").lower()
    article_file_name = os.path.join(base_dir, f"{safe_topic}_draft.md")
    fact_check_file_name = os.path.join(base_dir, f"{safe_topic}_fact_check.md")
    research_file_name = os.path.join(base_dir, f"{safe_topic}_research.md")
    final_article_file_name = os.path.join(base_dir, f"{safe_topic}_final.md")

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
