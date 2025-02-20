# Multi Personality Example

This example demonstrates how to orchestrate an LLM-powered agents with different personalities acting in an autonomous fashion. The agent leverages an orchestration system where a root orchestration agent with a "responsible" personality decides when and how to interact using the Twitter agent, who may be a bit more unhinged and not well suited for "managing" the overall process.

## Overview

- Sets up the orchestrator configuration including LLM model settings, prompts, tools (including the Twitter agent tool). This includes a twitter agent and a more responsible orchestrator agent to manage the twitter agent.
- Defines an initial message that instructs the agent with social media management tasks (e.g., checking the timeline, liking tweets, replying to mentions, and posting new tweets).
- Enters an infinite loop where the orchestrator runner executes the workflow, logs the results, updates the prompt based on the agent direction, and schedules subsequent iterations based on the orchestrator agent's recommendation or a default delay.

## Usage

1. Ensure all dependencies are installed with `yarn install`.
2. Run the example by calling `yarn example:multi-personality <your-character-name>`.
3. Monitor the logs to see how the agent interacts, updates its workflow, and schedules subsequent interactions.

This example serves as a template for integrating a social media management agent managed by a more responsible orchestration agent, and can be extended to support more complex scenarios and integrations.
