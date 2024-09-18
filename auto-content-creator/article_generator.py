import os
from autogen.agentchat import AssistantAgent, ConversableAgent
from config import llm_config_4o


def create_article_generator_agent():
    return AssistantAgent(
        name="ArticleGenerator",
        system_message=(
            "You are an expert in web3 technologies and content creation. "
            "Your task is to generate informative and engaging article drafts on trending web3 topics."
        ),
        llm_config=llm_config_4o,
        human_input_mode="NEVER",  # Prevents waiting for human input
        max_consecutive_auto_reply=1,  # Limits auto-replies
    )


def generate_article(topic):
    manager_agent = ConversableAgent(
        name="Manager",
        human_input_mode="NEVER",  # Prevents waiting for human input
        max_consecutive_auto_reply=0,  # Limits auto-replies
    )
    article_agent = create_article_generator_agent()

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

    # Manager initiates chat with ArticleGenerator
    manager_agent.initiate_chat(
        recipient=article_agent,
        message=prompt,
        send_final_response=True,  # Ensure the assistant sends a final response
    )

    # Retrieve the assistant's reply
    conversation = article_agent.chat_messages.get(manager_agent, [])
    article_content = (
        conversation[-1]["content"] if conversation else "Error: No response generated"
    )

    return article_content


def save_article(topic, content):
    # Create the articles directory if it doesn't exist
    os.makedirs("articles", exist_ok=True)

    # Create a file name based on the topic
    file_name = f"articles/{topic.replace(' ', '_').lower()}.md"

    # Write the content to the file
    with open(file_name, "w") as f:
        f.write(content)

    return file_name
