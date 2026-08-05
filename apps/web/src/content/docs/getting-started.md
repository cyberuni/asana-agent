---
title: Getting Started
description: Install and configure cyber-asana
---

## Installation

```bash
npm install -g cyber-asana
```

## Authentication

Set your [Asana personal access token](https://app.asana.com/0/my-apps):

```bash
export ASANA_ACCESS_TOKEN=<your-pat>
export ASANA_WORKSPACE_GID=<workspace-gid>   # optional default workspace
```

Or pass `--token <pat>` and `--workspace <gid>` per command.

To see which credential is actually in effect:

```bash
cyber-asana auth status
```

### OAuth

A PAT is the simpler choice for a single user. OAuth is worth the setup when several people use the same install, or when you want a credential that refreshes itself.

cyber-asana uses **your own** Asana app, so no third-party registration ever sees your data. Create one at [app.asana.com/0/my-apps](https://app.asana.com/0/my-apps), then:

```bash
export ASANA_CLIENT_ID=<client-id>
export ASANA_CLIENT_SECRET=<client-secret>
cyber-asana auth login
```

See the [full OAuth documentation](https://github.com/cyberuni/cyber-asana#oauth) for redirect URL options, token management, and logout.

## Quick Start

```bash
# Check your connection
cyber-asana auth status

# List your projects
cyber-asana project list

# List tasks in a project
cyber-asana task list --project <gid>

# Create a task
cyber-asana task create "Fix the bug" --workspace-gid <gid> --project-gid <gid>

# Start the MCP server
cyber-asana mcp
```

## Next Steps

- [Install agent skills](/cyber-asana/skills/) for guided workflows
- [Configure MCP](/cyber-asana/mcp/) for AI agents
- [Explore CLI commands](/cyber-asana/cli/) for scripting
