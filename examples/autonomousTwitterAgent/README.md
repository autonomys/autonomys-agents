# Autonomous Twitter Agent Example

This example demonstrates how to orchestrate an LLM-powered agent designed to simulate a social media manager interacting on Twitter. The autonomous Twitter agent tool is a tool that is used to interact with Twitter in a more autonomous fashion using our orchestration system. The agent is given to a root agent that is responsible for deciding when and how to use the twitter agent as a tool. This serves as an example of how to use the autonomous orchestration system in a hierarchical way, where domain specific agents can be crafted using the orchestration system, wrapped as a tool and then used in a larger orchestration system. The workflow is divided across two main files:

## agent.ts

- Sets up the orchestrator configuration for the agent by combining the orchestration logic, prompts, and tools.
- Imports and configures the directed Twitter agent tool along with other utility tools.
- Configures the LLM model (using Anthropic's Claude in this example), and sets pruning parameters for workflow management.
- Exports an orchestrator runner, which ensures that the workflow is only initialized once and can be reused across iterations.

## index.ts

- Acts as the entry point for the example application.
- Validates the local configuration hash to ensure integrity before starting the workflow.
- Defines an initial message that instructs the agent with social media management tasks. Example tasks include:
  - Checking the timeline for interesting conversations and joining them.
  - Liking tweets or following interesting users.
  - Replying to mentions and engaging in conversations.
  - Posting new tweets when appropriate.
- Enters an infinite loop where:
  - The orchestrator runner is triggered to execute the workflow with the current message prompt.
  - The result of each workflow execution is logged and used to update the prompt for the next iteration. This is driven entirely by the agent, giving it the ability to determine when and how to run the workflow.
  - A delay is introduced between iterations based on either a computed delay or a default configuration value.

## Usage

1. Ensure the project is built and all dependencies are installed.
2. Run the example by calling `yarn example:autonomousTwitterAgent <your-character-name>`.
3. Monitor the logs to see how the agent interacts, updates its workflow, and schedules subsequent interactions.

This example serves as a template for integrating a social media management agent powered by LLM orchestration, and can be extended to support more complex scenarios and integrations.
