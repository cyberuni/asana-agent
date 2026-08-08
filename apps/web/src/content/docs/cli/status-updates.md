---
title: Status updates
description: Post and read status updates on projects, portfolios, and goals.
sidebar:
  order: 9
---

One command group covers status updates on all three parent types — projects, portfolios,
and goals. The `--parent-gid` flag takes whichever one you mean.

```sh
cyber-asana status overview <project-gid>
cyber-asana status overview <portfolio-gid>

cyber-asana status list --parent <project-gid>
cyber-asana status list --parent <portfolio-gid>
cyber-asana status list --parent <goal-gid>

cyber-asana status get <gid>
cyber-asana status create --parent <project-gid> --status-type on_track --text "Shipping on schedule"
cyber-asana status delete <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `overview` | `<parent-gid>` | `--limit <number>`, `--parent-type <project\|portfolio>`, `--full` |
| `list` | — | `--parent-gid <gid>` / `--parent <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |
| `create` | — | `--parent-gid <gid>`, `--status-type <type>` (required), `--text <text>`, `--html-text <html>`, `--title <title>` |
| `delete` | `<gid>` | — |

## Roll-up

`status overview` answers "how is this doing?" in one command. Give it a project GID and
you get that project's latest status update and its task counts. Give it a portfolio GID
and you also get one row per item.

```sh
cyber-asana status overview <project-gid>
cyber-asana status overview <portfolio-gid>
cyber-asana status overview <portfolio-gid> --limit 50
cyber-asana status overview <project-gid> --parent-type project
```

It is deterministic and parent-scoped: it takes a GID and never searches. If you need to
*find* the projects to report on, that is the official Asana MCP's `get_status_overview`
— see [MCP comparison](/cyber-asana/reference/mcp-comparison/).

### What it costs

The parent type is detected by trying the portfolio endpoint first and falling back to the
project endpoint, which costs one extra call for a project. Pass `--parent-type` to skip it.

| Parent | API calls |
| --- | --- |
| Project, with `--parent-type project` | 3 |
| Project, detected | 4 |
| Portfolio with N items | 3 + 2N |

`--limit` caps N (default 25, max 100). When a portfolio holds more items than the cap, the
output says so — `truncated: true` in `--json`, and a "Roll-up capped at N items" line in
text mode — rather than quietly dropping them. Page through the rest with
[`portfolio items`](/cyber-asana/cli/portfolios/).

Status body text is truncated with a size hint; pass `--full` for the whole thing.

## Status types

`--status-type` is required on create. Asana accepts `on_track`, `at_risk`, `off_track`,
`on_hold`, and `complete`.

```sh
cyber-asana status create --parent <project-gid> \
  --status-type at_risk \
  --title "Week 12 check-in" \
  --html-text '<body>Blocked on <strong>vendor sign-off</strong>.</body>'
```

`--text` and `--html-text` are alternative ways to write the body. Status update bodies are
truncated in list output with a size hint; pass `--full` for the complete text.
