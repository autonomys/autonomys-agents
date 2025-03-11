# Add Webhook Issue Reporting Tool

## Overview
This PR introduces a webhook-based issue reporting mechanism that allows agents to report problems they encounter during operation. Issues reported through the webhook are automatically scheduled as tasks for the orchestrator.

## Changes

- **New Webhook Tool**: Added `createWebhookIssueReportTool` to enable agents to report issues
- **Agent Integration**: Integrated the webhook tool with Twitter agent and orchestrator
- **API Endpoint**: Created webhook controller and API routes to handle issue reports
- **Agent Instructions**: Updated agent prompts to inform them about using the webhook for issue reporting

## Technical Details

- Webhook reports are posted to `http://localhost:{port}/api/webhook`
- Issues are logged and then scheduled as tasks for the orchestrator
- Added appropriate error handling and logging

## Testing

To test this feature:
1. Start the application with the API server
2. Use an agent that triggers an issue
3. Verify the issue is reported via webhook and a task is created in the orchestrator 