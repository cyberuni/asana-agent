# cyber-asana

## 0.6.0

### Minor Changes

- 4d692be: Make the CLI and MCP server follow the 10 agent-friendly CLI principles:

  - **Token-efficient output** — new `--toon` flag emits compact TOON (~40% fewer
    tokens than JSON); opt-in `CYBER_ASANA_MCP_FORMAT=toon` does the same for every
    MCP tool result.
  - **Minimal default schemas** — task lists request only `gid,name,completed,due_on`
    by default (also fixes previously-blank Done/Due columns).
  - **Content truncation** — large task notes are truncated with a size hint; `--full`
    restores the complete value.
  - **Definitive empty states** — empty results print `0 results` instead of `(none)`.
  - **Pre-computed aggregates & next steps** — task lists print a count summary and
    follow-up command suggestions (text mode only).
  - **Structured errors & exit codes** — errors are structured under `--json`/`--toon`
    and map to distinct exit codes (auth, forbidden, not found, rate limited, config).
  - **Content first** — running with no arguments shows live data (the authenticated
    user) instead of help text.
  - **Consistent help** — concise examples in top-level and per-resource `--help`.

- c25ad46: Roll the agent-friendly output conventions out from the `tasks` domain to the
  whole CLI, and fix two contract violations.

  Fixes:

  - **Mutation acknowledgements honor `--json`/`--toon`.** Deletes and relationship
    mutations across tasks, projects, goals, tags, sections, status, and portfolios
    printed prose regardless of the requested format. All 15 sites now emit a
    structured payload.
  - **The `Next offset:` hint is gated to text mode**, like the summary and
    next-step helpers.

  Rollout:

  - **Minimal default schemas** — every list command now requests a small default
    field set when the caller gives no `--opt-fields`.
  - **Count summaries and next-step hints** on every list command, not just tasks.
  - **Truncation** applies to project notes, status update bodies, and comment
    bodies, so the documented `--full` flag is meaningful beyond task notes.
  - **Empty states name the entity** — `0 tasks found` rather than a bare
    `0 results`.
  - **Self-correcting usage errors** — an unknown flag or subcommand now reports
    the flags that command accepts plus a `--help` pointer, and exits `2`.
  - **Idempotent deletes** — deleting something already gone succeeds and reports
    `already_absent: true` instead of failing with a 404.
  - **Usage examples in every resource group's `--help`**, and `bin`,
    `description`, and `version` lines on the bare-invocation home view.
  - **New `cyber-asana setup hook`** installs a SessionStart hook so an agent
    session opens with live Asana context. Installing twice is a no-op.

### Patch Changes

- 8ca4d9f: Update dependencies. Notably `asana` to 3.1.12 and `@modelcontextprotocol/sdk`
  to 1.30.0.
- 3f3607c: Fix `story create --html-text` reporting a locally-rejected payload as
  `Asana rejected html_text: ...`. The local shape check now runs outside the
  try/catch that wraps the Asana call, so a payload that never left the machine
  keeps its local error message instead of being attributed to Asana.
- 14d1e58: Fix `story list` ignoring `--full` on the `Text` column. The 60-character cut
  now goes through the shared `truncate()` helper, so truncated text carries a
  size hint and `--full` prints the whole comment — matching every other
  free-text field in the package.
- 949a8c4: Fix `task subtask list` include flags (`--assignee-email`, `--follower-emails`,
  `--num-subtasks`, `--custom-fields`) suppressing the default `gid,name,completed,due_on`
  field set, which left the Name/Done/Due columns blank. The flags now add to the field
  set — the caller's `--opt-fields` when given, the default when not.
- 877f348: Fix `task create` sending followers twice. The followers already ride the
  `POST /tasks` create body, so the extra `addFollowers` request was redundant —
  it is gone. Creating a task with followers now makes exactly one round trip and
  returns the create response instead of the follower-addition response.

## 0.5.0

### Minor Changes

- a27ba3d: feat: add status updates and portfolio items via REST

  Adds an `asana_status_*` toolset (list, get, create, delete) for status updates
  on projects, portfolios, and goals, plus `asana_portfolio_item_list` for listing
  the items in a portfolio. Both are also available as `status` and `portfolio
items` CLI commands. These close the official MCP gaps for
  `get_status_overview`, `create_project_status_update`, and
  `get_items_for_portfolio`.

- e3870df: feat(tasks): return html_notes by default and guide agents to use it

## 0.4.1

### Patch Changes

- aff1e0d: Fix polynomial ReDoS vulnerability in HTML tag validation regex.

## 0.4.0

### Minor Changes

- 042e2ca: Add `config list` subcommand as an alias for `config show`.

## 0.3.2

### Patch Changes

- e1cc84d: Fix the preferred cyber-asana token variable name to `ASANA_ACCESS_TOKEN`, while keeping `ASANA_TOKEN` as a deprecated fallback.

## 0.3.1

### Patch Changes

- 35769bc: Prefer `ASANA_ASSESS_TOKEN` and `ASANA_WORKSPACE_GID` for cyber-asana configuration, while keeping `ASANA_TOKEN` and `ASANA_WORKSPACE` as deprecated fallbacks.

## 0.3.0

### Minor Changes

- f9e1dcc: Add `url parse` CLI command and `asana_url_parse` MCP tool to extract workspace and project GIDs from Asana URLs without API calls.
- 5607d24: Add repo project registry (`.agents/cyber-asana.json`) with `config` CLI commands for add, resolve, sync, and show. Generalize create-asana-task skill for task creation with or without URLs.

## 0.2.0

### Minor Changes

- 952965b: Add batch task lookup by GID via Asana's `/batch` API, including MCP support and manual system tests.
- 6b3e45f: Add `task my-tasks` CLI command and `asana_task_my_tasks` MCP tool to list the authenticated user's My Tasks. Supports `--completed-since`, pagination, and `--opt-fields`.
- 2f073b2: Add pagination and `opt_fields` options to list commands and MCP list tools.
- 3a79c4e: Add `project search` and `asana_project_search` support for searching projects by name pattern and Asana project search filters.
- 51d5d86: Add `project counts` CLI and `asana_project_counts` MCP support for project task counts.
- 2f614ac: Add subtask list and create operations: `task subtask-list <task-gid>` CLI command, `task subtask-create <task-gid> <name>` CLI command, `asana_task_subtask_list` MCP tool, and `asana_task_subtask_create` MCP tool.
- e2b5805: Add injectable `stories` and `tags` gateways plus shared-client composition helpers for cleaner testing and runtime wiring.
- 827b42a: Add default list page sizes and fetch-all pagination options with page caps.
- dceb4f2: Add richer project create and update fields, including rich notes, privacy, default view, and explicit date clearing for projects and tasks.
- 0645b1c: Expand `task search` filters to cover the full Asana search API: `.not` and `.all` variants for assignee, project, section, and tag; portfolio, follower, created-by, assigned-by, liked-by, and commented-on-by filters; and date-range filters for due, start, created, completed, and modified dates. All new filters are exposed in both the CLI and the MCP tool.
- 0061a5d: Add task create and update support for HTML notes, parent relationships, resource subtype, custom fields, follower management, and multi-project creation.
- 8469089: Add `create*Api` factory functions and `*Gateway` types for all remaining domains (workspaces, sections, users, teams, attachments, portfolios, goals, tasks, projects).

  Each domain now exposes a `create*Api(gateway)` factory that accepts an injected gateway, enabling use without the Asana SDK or real API calls. The Asana-backed `createAsana*Gateway(client)` factory is also exported for runtime composition.

- d72e6bc: Add `createRuntimeContext`, `registerCliCommands`, and `registerMcpTools` for composing a shared Asana client across all domain APIs. Fix CLI and MCP to report the package version from `package.json`.
- 4850ead: Add tag update/delete, task-tag relationship commands, and formatted story comment support with `html_text` validation.

## 0.1.0

### Minor Changes

- b6a34b0: Initial release of `cyber-asana` — an Asana CLI and MCP server for AI agents.

  **CLI** (`cyber-asana <resource> <action>`):

  - Covers all major Asana resources: workspaces, projects, tasks, sections, users, teams, portfolios, goals, tags, attachments, and stories
  - Human-readable output by default (key-value for single items, table for lists); pass `--json` for raw API JSON
  - `ASANA_TOKEN` env var for authentication; `--token` flag overrides per invocation
  - `ASANA_WORKSPACE` env var for default workspace GID; `--workspace` flag overrides per invocation
  - Clear setup instructions printed when `ASANA_TOKEN` is missing

  **MCP server** (`node dist/mcp.js`, stdio transport):

  - Exposes all CLI operations as MCP tools named `asana_<resource>_<action>`
  - Drop-in for any MCP-compatible AI agent host
