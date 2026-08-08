---
title: MCP Server
description: cyber-asana Model Context Protocol server reference
---

`cyber-asana` ships a stdio MCP server. Set [authentication](/cyber-asana/getting-started/#authentication) env vars (`ASANA_ACCESS_TOKEN`, optional `ASANA_WORKSPACE_GID`) before connecting.

## Server Configuration

Install `cyber-asana` in the project that hosts your agent (`npm install cyber-asana`). The host spawns a child process and talks MCP over stdio.

| Context | `command` | `args` |
| --- | --- | --- |
| Project dependency | `node` | `["-e", "import('cyber-asana/mcp')"]` |
| Project dependency (bin) | `cyber-asana` | `["mcp"]` |
| Ephemeral (`npx`) | `npx` | `["-y", "cyber-asana", "mcp"]` |

### Output Format

Tools return JSON by default. Set `CYBER_ASANA_MCP_FORMAT=toon` in the server's `env` to emit token-efficient TOON instead.

## Claude Desktop

| OS | Config file |
| --- | --- |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "cyber-asana": {
      "command": "node",
      "args": ["-e", "import('cyber-asana/mcp')"],
      "env": {
        "ASANA_ACCESS_TOKEN": "<your-pat>",
        "ASANA_WORKSPACE_GID": "<workspace-gid>"
      }
    }
  }
}
```

## Claude Code

**User or local scope** (recommended for personal tokens):

```bash
claude mcp add -e ASANA_ACCESS_TOKEN=<your-pat> -e ASANA_WORKSPACE_GID=<workspace-gid> cyber-asana -- \
  node -e "import('cyber-asana/mcp')"
```

**Project scope** — commit `.mcp.json` in the repo root:

```json
{
  "mcpServers": {
    "cyber-asana": {
      "command": "node",
      "args": ["-e", "import('cyber-asana/mcp')"],
      "env": {
        "ASANA_ACCESS_TOKEN": "${ASANA_ACCESS_TOKEN}",
        "ASANA_WORKSPACE_GID": "${ASANA_WORKSPACE_GID}"
      }
    }
  }
}
```

Verify with `claude mcp list`. Use `/mcp` in a session to reconnect without restarting.

## Cursor

User-wide: `~/.cursor/mcp.json`. Project-specific: `.cursor/mcp.json` in the repo root. Agent mode is required for tool use.

## Codex

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.cyber-asana]
command = "node"
args = ["-e", "import('cyber-asana/mcp')"]

[mcp_servers.cyber-asana.env]
ASANA_ACCESS_TOKEN = "<your-pat>"
ASANA_WORKSPACE_GID = "<workspace-gid>"
```

## MCP Inspector

Debug tools and schemas without an agent host:

```bash
npx @modelcontextprotocol/inspector \
  -e ASANA_ACCESS_TOKEN=<your-pat> \
  -e ASANA_WORKSPACE_GID=<workspace-gid> \
  -- npx -y cyber-asana mcp
```

## Using alongside Official Asana MCP

You can run **both** the [official Asana MCP](https://developers.asana.com/docs/mcp-tools-reference) and cyber-asana in the same host. Tool names differ (`create_tasks` vs `asana_task_create`), so the conflict is the **config key** — use `"asana"` for the official server and `"cyber-asana"` for this package.

| Server | Config key | Auth |
| --- | --- | --- |
| Official Asana MCP | `asana` | OAuth 2.0 |
| cyber-asana | `cyber-asana` | Personal access token |

**Which server to use:**

| Prefer official `asana` | Prefer `cyber-asana` |
| --- | --- |
| Cross-type object search in one call | Single-type object search (`asana_search_objects`), `asana_url_parse`, repo config |
| Interactive previews | Subtasks, dependencies, followers, section placement |
| Asana AI agents | `asana_task_scan_todos`, `asana_project_export`, rich REST-backed writes |
| New MCP-only capabilities | Goals/tags/portfolios CRUD, portfolio items, status updates |

Default: if both can do the job, prefer **official for discovery and previews** and **cyber-asana for write-heavy automation**.

## Available Tools

| Resource | Tools |
| --- | --- |
| `workspace` | `asana_workspace_list`, `asana_workspace_get` |
| `project` | `asana_project_list`, `asana_project_get`, `asana_project_counts`, `asana_project_search`, `asana_project_create`, `asana_project_update`, `asana_project_delete`, `asana_project_export` |
| `task` | `asana_task_list`, `asana_task_my_tasks`, `asana_task_subtask_list`, `asana_task_subtask_create`, `asana_task_get`, `asana_task_get_many`, `asana_task_create`, `asana_task_update`, `asana_task_delete`, `asana_task_search`, `asana_task_follower_add`, `asana_task_follower_remove`, `asana_task_project_add`, `asana_task_project_remove`, `asana_task_dependency_list`, `asana_task_dependency_add`, `asana_task_dependency_remove`, `asana_task_dependent_list`, `asana_task_dependent_add`, `asana_task_dependent_remove`, `asana_task_scan_todos` |
| `task-template` | `asana_task_template_list`, `asana_task_template_get`, `asana_task_template_instantiate` |
| `section` | `asana_section_list`, `asana_section_get`, `asana_section_create`, `asana_section_update`, `asana_section_move`, `asana_section_task_add`, `asana_section_delete` |
| `user` | `asana_user_list`, `asana_user_get`, `asana_user_me` |
| `team` | `asana_team_list`, `asana_team_get` |
| `portfolio` | `asana_portfolio_list`, `asana_portfolio_item_list`, `asana_portfolio_get`, `asana_portfolio_create`, `asana_portfolio_update`, `asana_portfolio_delete` |
| `goal` | `asana_goal_list`, `asana_goal_get`, `asana_goal_create`, `asana_goal_update`, `asana_goal_delete` |
| `tag` | `asana_tag_list`, `asana_tag_get`, `asana_tag_create`, `asana_tag_update`, `asana_tag_delete`, `asana_tag_list_for_task`, `asana_tag_list_tasks`, `asana_tag_add_to_task`, `asana_tag_remove_from_task` |
| `attachment` | `asana_attachment_list`, `asana_attachment_get`, `asana_attachment_create`, `asana_attachment_delete` |
| `status` | `asana_status_list`, `asana_status_get`, `asana_status_create`, `asana_status_delete` |
| `story` | `asana_story_list`, `asana_story_get`, `asana_story_create`, `asana_story_update`, `asana_story_delete` |
| `comment` | `asana_comment_list`, `asana_comment_get`, `asana_comment_create`, `asana_comment_update`, `asana_comment_delete` (aliases for `story`) |
| `search` | `asana_search_objects` (typeahead; one `resource_type` per call, single capped page, not exhaustive) |
| `url` | `asana_url_parse` (no API call; extracts GIDs from Asana app URLs) |

List tools accept `limit`, `offset`, `opt_fields`, `fetch_all`, and `max_pages` where Asana supports them.

### Notable Parameters

- `asana_task_template_instantiate` — `name` names the created task; instantiation is a job, so the tool polls it for `timeout_seconds` (default 10) and returns the job with `new_task` once it succeeds. `wait: false` returns the pending job immediately
- `asana_task_list`, `asana_task_my_tasks`, `asana_task_subtask_list` — `incomplete: true` filters to incomplete tasks
- `asana_task_create` — `project_gid`, `project_gids`, `follower_gids`, `html_notes`, `parent_gid`, `resource_subtype`, `custom_fields`
- `asana_task_update` — `html_notes`, `parent_gid`, `clear_parent`, `resource_subtype`, `custom_fields`
- `asana_story_create` / `asana_comment_create` — `template: true` interpolates `{task.name}`, `{task.assignee}`, `{task.due_on}`, `{task.notes}`
- `asana_story_update` / `asana_story_delete` (and the `comment` aliases) — take `story_gid`; only comment stories you authored can be changed, and a refusal is a `403` carrying that as a hint
- `asana_search_objects` — `resource_type` (one per call), `query`, `count` (1–100, default 20), `opt_fields`. Turns a name into a GID; not paginated and not exhaustive
- `asana_url_parse` — local URL parsing; use `workspace_gid` + `project_gid` for create; `list_view_gid` is not a section GID
