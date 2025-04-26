# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New `update` command to update agent projects to the latest template version
- Git integration for template initialization and updates
- Backup branch creation during template updates for safety
- Conflict detection and resolution guidance

## [0.1.1] - 2025-04-23
###Change
- Rename autoOS to agent-os

## [0.1.0] - 2025-04-22

### Added
- Initial release of agent-os CLI
- Core commands: `init`, `install`, `publish`, `search`, `tool`, `config`, `clean`
- Secure credential management using system keychain
- Auto Drive integration for package storage and retrieval
- Support for Auto-EVM blockchain integration
- Project initialization with agent templates
- Tool publishing and installation utilities 