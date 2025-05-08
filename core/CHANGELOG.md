# Changelog

All notable changes to the `@autonomys/agent-core` package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-05-08

### Added

- Chat node has been added!

### Changed

- Chat Agent API route has been modified based on new design of chat agent.

## [0.2.4] - 2025-04-28

### Fixed

- Importing an exporting of some types from 'agent-twitter-client'

## [0.2.3] - 2025-04-25

### Added

- Added rollup config to consolidate types after building
- Added barrel files to exports most of the imports

## [0.2.2] - 2025-04-25

### Added

- Added prompt caching support for Anthropic models

## [0.2.1] - 2025-04-24

### Added

- Fixed bug with Twitter authentication that continued to retry cookie authentication even when no cookies were available

## [0.2.0] - 2025-04-22

### Added

- Enhanced Agent API task management with real-time streaming support for task states:
  - Cancelled tasks
  - Deleted tasks
  - Failed tasks

### Changed

- Improved directory resolution logic for system resources:
  - Character files
  - Certificate files
  - Cookie storage

## [0.1.2] - 2025-04-17

### Added

- Added Notion Model Context Protocol (MCP) integration
- Added `createNotionTools` function for Notion connectivity
- Added `NOTION_INTEGRATION_SECRET` configuration parameter
- Exported MCP client tool functionality

## [0.1.0] - 2025-04-15

### Added

- First official release of the Autonomys Agent Core package
- Core agent workflow system and orchestration capabilities
- Integration with multiple LLM providers (OpenAI, Anthropic, etc.)
- Tools for external service integration:
  - Slack communication
  - Twitter integration
  - GitHub operations
  - Notion connectivity
  - Web search capabilities
- Vector database integration for agent memory and knowledge
- Configuration system with character customization
- Blockchain integration for agent identity and experience tracking
- HTTP/2 API for agent control and management

### Changed

- N/A (Initial release)

### Fixed

- N/A (Initial release)

### Removed

- N/A (Initial release)
