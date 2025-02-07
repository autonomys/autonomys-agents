# Autonomous Twitter Agent Example

This example demonstrates how to orchestrate an LLM-powered agent designed to simulate a social media manager interacting on Twitter in an autonomous fashion. In this updated version, the workflow is consolidated into a single file, streamlining both configuration and execution. The agent leverages an orchestration system where a root agent decides when and how to interact using the Twitter tool as part of a larger orchestration framework.

## Overview

- Consolidates the orchestrator configuration and main application logic into one file.
- Sets up the orchestrator configuration including LLM model settings, prompts, tools (including the Twitter agent tool), and pruning parameters.
- Validates the local configuration hash before starting the workflow.
- Defines an initial message that instructs the agent with social media management tasks (e.g., checking the timeline, liking tweets, replying to mentions, and posting new tweets).
- Enters an infinite loop where the orchestrator runner executes the workflow, logs the results, updates the prompt based on the workflow output, and schedules subsequent iterations based on a computed or default delay.

## Usage

1. Ensure the project is built and all dependencies are installed.
2. Run the example by calling `yarn example:autonomousTwitterAgent <your-character-name>`.
3. Monitor the logs to see how the agent interacts, updates its workflow, and schedules subsequent interactions.

This example serves as a template for integrating a social media management agent powered by LLM orchestration, and can be extended to support more complex scenarios and integrations.
