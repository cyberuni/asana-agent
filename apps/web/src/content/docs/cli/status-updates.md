---
title: Status updates
description: Post and read status updates on projects, portfolios, and goals.
sidebar:
  order: 9
---

One command group covers status updates on all three parent types — projects, portfolios,
and goals. The `--parent-gid` flag takes whichever one you mean.

```sh
cyber-asana status list --parent <project-gid>
cyber-asana status list --parent <portfolio-gid>
cyber-asana status list --parent <goal-gid>

cyber-asana status get <gid>
cyber-asana status create --parent <project-gid> --status-type on_track --text "Shipping on schedule"
cyber-asana status delete <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--parent-gid <gid>` / `--parent <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |
| `create` | — | `--parent-gid <gid>`, `--status-type <type>` (required), `--text <text>`, `--html-text <html>`, `--title <title>` |
| `delete` | `<gid>` | — |

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
