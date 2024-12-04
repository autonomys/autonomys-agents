# Experimental Autonomous Agents for Web3 and AI Integration

This project serves as an experimental playground for exploring the integration of autonomous agents with the Autonomys network, focusing on the intersection of web3 and artificial intelligence.

## Project Vision

Our goal is to investigate and develop innovative approaches to:

1. Create autonomous agents capable of interacting with web3 technologies
2. Integrate these agents with the Autonomys network
3. Explore synergies between AI and blockchain technologies
4. Push the boundaries of decentralized, autonomous systems

## Key Areas of Exploration

- Autonomous agent architectures suitable for web3 environments
- Integration patterns with the Autonomys network
- AI-driven decision-making in decentralized systems
- Smart contract interactions through autonomous agents
- Privacy and security considerations in AI-web3 integrations

## Projects

### Auto Chain Agent

A blockchain interaction service that provides natural language processing capabilities for blockchain operations on the Autonomys Network.

Key features:
- Natural language processing for blockchain interactions
- Memory-enabled conversations with permanent context retention on the [Autonomys Network's Distributed Storage Network](https://academy.autonomys.xyz/subspace-protocol/network-architecture/distributed-storage-network) (DSN)
- Balance checking and transaction management
- Wallet management
- Transaction history summary

Technologies:
- Agent Framework: LangGraph + LangChain.js
- Database: SQLite + Autonomys Network DSN

Available Tools:
- Balance checking
- Token transfers (AI3)
- Transaction history summary
- Wallet creation

### Auto Content Creator Approaches

We explore two different approaches to creating autonomous content creation agents:

#### 1. Python Implementation (auto_content_creator)
- Primary Language: Python
- Agent Framework: AutoGen

This approach utilizes [AutoGen](https://github.com/microsoft/autogen), a framework for building Large Language Model (LLM) applications using multiple agents. AutoGen enables the creation of customizable, conversable agents that can work together to accomplish tasks.

Key features:
- Multi-agent system for research, content generation, and fact-checking
- Customizable agent behaviors and interactions
- Integration with various LLM models

#### 2. TypeScript Implementation (auto-content-creator)
- Primary Language: TypeScript
- Agent Framework: LangChain.js with LangGraph

This approach leverages [LangChain.js](https://js.langchain.com/) and [LangGraph](https://github.com/langchain-ai/langgraphjs), which provide a powerful framework for building applications with LLMs. LangGraph, in particular, allows for the creation of complex, stateful workflows.

Key features:
- Structured workflow using LangGraph for content creation process
- Modular design with separate nodes for research, generation, and reflection
- Type-safe schemas using Zod for better data validation

### Auto KOL (Key Opinion Leader)

An intelligent agent framework designed to engage with thought leaders on Twitter through automated, context-aware interactions.

Key features:
- Automated tweet monitoring and response generation
- Multi-step workflow with engagement decision making
- Tone analysis and adaptive response strategies
- Human-in-the-loop approval system
- Rate limit handling and queue management

Technologies:
- Agent Framework: LangChain.js with LangGraph
- Twitter API integration
- Express.js backend

## Project Status

This project is in its early experimental stages. We are actively exploring concepts, testing ideas, and iterating on designs. As such, the codebase and documentation may change rapidly and significantly.

## Disclaimer

This is a highly experimental project. Concepts and implementations are subject to change. Use at your own risk.
