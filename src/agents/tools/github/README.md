# GitHub Tool

This is a GitHub integration that allows interaction with GitHub repositories, specifically for managing issues.

## Environment Variables

```env
GITHUB_TOKEN="ghp_..."  # GitHub Personal Access Token
```

## Setup

1. Create a GitHub Personal Access Token:

   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Click "Generate new token (classic)"
   - Give it a descriptive name
   - Select the following permissions:
     - `repo` (Full control of private repositories)
     - Or more specifically:
       - `repo:status`
       - `repo_deployment`
       - `public_repo`
       - `repo:invite`
       - `security_events`

2. Set the following environment variables:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   GITHUB_OWNER=your_github_username_or_org
   GITHUB_REPO=your_repository_name
   ```

## Features

The GitHub tool provides the following functionality:

- List issues in a repository (filtered by state: open/closed/all)
- Create new issues with title, description, labels, and assignees

## GitHub API Documentation

For more information about the GitHub API, visit the [GitHub REST API Documentation](https://docs.github.com/en/rest).
