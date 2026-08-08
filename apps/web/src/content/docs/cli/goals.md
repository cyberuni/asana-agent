---
title: Goals
description: Manage Asana goals from the command line.
sidebar:
  order: 7
---

Goals are workspace-scoped objectives. `list` and `create` fall back to `ASANA_WORKSPACE`
when `--workspace-gid` is omitted.

```sh
cyber-asana goal list
cyber-asana goal get <gid>
cyber-asana goal create "Reach 1000 users" --due-on 2026-12-31
cyber-asana goal update <gid> --name "Reach 2000 users"
cyber-asana goal delete <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--workspace-gid <gid>` / `--workspace <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |
| `create` | `<name>` | `--workspace-gid <gid>`, `--notes <text>`, `--due-on <date>` |
| `update` | `<gid>` | `--name <name>`, `--notes <text>`, `--due-on <date>` |
| `delete` | `<gid>` | — |

Dates use `YYYY-MM-DD`.

Goal metrics, followers, and parent-goal relationships are not wrapped — see
[API coverage](/cyber-asana/reference/api-coverage/).

Goals can carry status updates. Pass a goal GID as the parent:

```sh
cyber-asana status list --parent <goal-gid>
```

See [Status updates](/cyber-asana/cli/status-updates/).
