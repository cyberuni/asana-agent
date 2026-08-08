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
cyber-asana section move <gid> --project <project-gid> --insert-after <section-gid>
cyber-asana section task add <section-gid> <task-gid>
cyber-asana section delete <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--project-gid <gid>` / `--project <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |
| `create` | `<name>` | `--project-gid <gid>` / `--project <gid>` |
| `update` | `<gid>` | `--name <name>` (required) |
| `move` | `<gid>` | `--project-gid <gid>` / `--project <gid>`, `--insert-before <gid>`, `--insert-after <gid>` |
| `task add` | `<section-gid> <task-gid>` | `--insert-before <gid>`, `--insert-after <gid>` |
| `delete` | `<gid>` | — |

## Reordering columns

`section move` places a section relative to another section in the same project.
Exactly one of `--insert-before` / `--insert-after` is required — they are mutually
exclusive, and the Asana API needs one of them to know where the section lands.
Sections cannot move between projects.

```sh
cyber-asana section move <gid> --project <project-gid> --insert-after <other-section-gid>
```

## Putting a task in a section

`section task add` places a task directly into a section — the section-scoped route,
for when you are thinking in board columns:

```sh
cyber-asana section task add <section-gid> <task-gid>
cyber-asana section task add <section-gid> <task-gid> --insert-before <other-task-gid>
```

The task is removed from any other section of the same project, and lands at the top of
the section unless `--insert-before` / `--insert-after` says otherwise (again, mutually
exclusive).

The same placement is reachable from the task side, when you are adding project
membership and a position in one call:

```sh
cyber-asana task project add <task-gid> <project-gid> --section <section-gid>
```

See [`task project add --section`](/cyber-asana/cli/tasks/#project-membership).
