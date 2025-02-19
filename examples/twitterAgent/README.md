# Twitter Agent Example

This example demonstrates how to orchestrate an LLM-powered agent designed to simulate a social media manager interacting on Twitter in an autonomous fashion. The agent leverages an orchestration system where a root agent decides when and how to interact using the Twitter tool as part of a larger orchestration framework.

## Overview

- Sets up the orchestrator configuration including LLM model settings, prompts, tools (including the Twitter agent tool).
- Defines an initial message that instructs the agent to complete social media management tasks.
- Enters an infinite loop where the orchestrator runner executes the workflow, logs the results, updates the prompt based on the agent direction, and schedules subsequent iterations based on a agent recommendation or default delay.

## Usage

1. Ensure all dependencies are installed with `yarn install`.
2. Run the example by calling `yarn example:twitter-agent <your-character-name>`.
3. Monitor the logs to see how the agent interacts, updates its workflow, and schedules subsequent interactions.

This example serves as a template for integrating a social media management agent powered by LLM orchestration, and can be extended to support more complex scenarios and integrations.
