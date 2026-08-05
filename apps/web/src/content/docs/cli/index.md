---
title: CLI Reference
description: cyber-asana command-line interface reference
---

Terminal and scripting interface — same API surface as MCP, without an agent host. For agents, prefer [Skills](/cyber-asana/skills/) and [MCP](/cyber-asana/mcp/) first.

```bash
cyber-asana <resource> <action> [options]
```

## Output Formats

Output is human-readable by default. Add `--toon` for token-efficient TOON (recommended for agents) or `--json` for raw API JSON.

```bash
cyber-asana task list --project <gid> --toon
cyber-asana task list --project <gid> --json
```

## Pagination

List commands support pagination and field selection:

```bash
cyber-asana task list --project <gid> --limit 50 --offset <next_page.offset>
cyber-asana task list --project <gid> --all --max-pages 5
cyber-asana project list --opt-fields gid,name,permalink_url
```

List commands request 100 results per page by default. Use `--all` to fetch multiple pages; `--max-pages` caps the number.

## Resources

| Resource | Actions |
|---|---|
| `workspace` | `list`, `get` |
| `project` | `list`, `get`, `counts`, `search`, `create`, `update`, `delete` |
| `task` | `list`, `my-tasks list`, `get`, `create`, `update`, `delete`, `subtask list`, `subtask create`, `search`, `project add/remove`, `follower add/remove`, `dependency list/add/remove`, `dependent list/add/remove` |
| `section` | `list`, `get`, `create`, `update`, `delete` |
| `user` | `list`, `get`, `me` |
| `team` | `list`, `get` |
| `portfolio` | `list`, `items`, `get`, `create`, `update`, `delete` |
| `goal` | `list`, `get`, `create`, `update`, `delete` |
| `tag` | `list`, `get`, `create`, `update`, `delete`, `tasks`, `task list/add/remove` |
| `attachment` | `list`, `get` |
| `status` | `list`, `get`, `create`, `delete` |
| `story` | `list`, `create` |
| `comment` | `list`, `create` (alias for `story`) |
| `setup` | `hook` |
| `auth` | `status`, `login`, `logout`, `token` |
| `config` | `add`, `show`, `sync`, `resolve-project` |
| `url` | `parse` |

## Agent-friendly Output

The CLI follows conventions that make its output cheap and unambiguous for AI agents:

- **Token-efficient output** — `--toon` emits TOON, a compact tabular format (~40% fewer tokens than pretty JSON)
- **Minimal default schemas** — every list command requests a small field set by default
- **Content truncation** — large text is truncated with a size hint; pass `--full` for complete values
- **Definitive empty states** — empty results name what was empty, e.g. `0 tasks found`
- **Aggregates & next steps** — list commands print count summaries and follow-up suggestions in text mode
- **Structured errors & exit codes** — `0` success, `1` generic, `2` usage, `3` auth/config, `4` forbidden, `5` not found, `6` rate limited
- **Self-correcting usage errors** — unknown flags report what the command accepts

All mutations are non-interactive and deletes are idempotent.

## Incomplete Tasks

All task list commands accept `--incomplete` as shorthand for `--completed-since now`:

```bash
cyber-asana task list --project <gid> --incomplete
cyber-asana task my-tasks list --incomplete
cyber-asana task subtask list <task-gid> --incomplete
```

## Task Search Filters

`task search` accepts an optional text query plus filters:

```bash
# Text search
cyber-asana task search "login"

# Incomplete tasks in a project
cyber-asana task search --no-completed --project <gid>

# Overdue milestones
cyber-asana task search --assignee <user-gid> --subtype milestone --due-on-before 2026-01-01

# Blocked tasks, sorted by due date
cyber-asana task search --is-blocked --sort-by due_date --json
```

**Status filters:** `--completed/--no-completed`, `--subtask/--no-subtask`, `--has-attachment`, `--is-blocking`, `--is-blocked`

**Resource filters** (accept `<gid[,gid...]>`): `--assignee`, `--project`, `--section`, `--tag`, `--team`, `--portfolio`, `--follower`, `--created-by`

**Date filters** (YYYY-MM-DD): `--due-on`, `--due-on-before`, `--due-on-after`, `--start-on`, `--created-on`, `--completed-on`, `--modified-on`

## Project Search Filters

```bash
cyber-asana project search "launch" --workspace-gid <gid>
cyber-asana project search --workspace-gid <gid> --no-completed --owner me
cyber-asana project search --workspace-gid <gid> --portfolio <gid> --sort-by due_date
```

## Task Dependencies

```bash
# List dependencies
cyber-asana task dependency list <task-gid>

# Add/remove dependencies
cyber-asana task dependency add <task-gid> <dep-gid>
cyber-asana task dependency remove <task-gid> <dep-gid>

# List/add/remove dependents
cyber-asana task dependent list <task-gid>
cyber-asana task dependent add <task-gid> <dep-gid>
```

## Task Project Membership

```bash
# Add task to a project
cyber-asana task project add <task-gid> <project-gid>

# Add into a specific section
cyber-asana task project add <task-gid> <project-gid> --section <section-gid>

# Remove from a project
cyber-asana task project remove <task-gid> <project-gid>
```

## Comments (Stories)

```bash
cyber-asana comment list --task <gid>
cyber-asana comment create "Great work!" --task <gid>

# With template interpolation
cyber-asana comment create "Hey {task.assignee}, '{task.name}' is due {task.due_on}" --task <gid> --template
```

## URL Parsing

Extract GIDs from Asana app URLs without calling the API:

```bash
cyber-asana url parse 'https://app.asana.com/1/<workspace>/project/<project>/list/<view>' --json
```

## Ambient Context Hook

Install a SessionStart hook so each agent session opens with live Asana context:

```bash
cyber-asana setup hook              # merges into .claude/settings.json
cyber-asana setup hook --dry-run    # report without writing
```

## Examples

```bash
# List projects
cyber-asana project list

# Search projects
cyber-asana project search "launch" --workspace-gid <gid>

# Create a task
cyber-asana task create "Fix the bug" --workspace-gid <gid> --project-gid <gid> --due-on 2026-06-01

# Search tasks
cyber-asana task search "login" --json

# Get project task counts
cyber-asana project counts <project-gid>

# List task subtasks with assignee emails
cyber-asana task subtask list <task-gid> --assignee-email
```
