---
title: Sections
description: Manage the sections (board columns) inside an Asana project.
sidebar:
  order: 4
---

Sections are the columns of a board or the groupings of a list view. They belong to a
project.

```sh
cyber-asana section list --project <project-gid>
cyber-asana section get <gid>
cyber-asana section create "In Review" --project <project-gid>
cyber-asana section update <gid> --name "In QA"
cyber-asana section delete <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--project-gid <gid>` / `--project <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |
| `create` | `<name>` | `--project-gid <gid>` / `--project <gid>` |
| `update` | `<gid>` | `--name <name>` (required) |
| `delete` | `<gid>` | — |

To move a task into a section, use
[`task project add --section`](/cyber-asana/cli/tasks/#project-membership) rather than a
section command:

```sh
cyber-asana task project add <task-gid> <project-gid> --section <section-gid>
```
