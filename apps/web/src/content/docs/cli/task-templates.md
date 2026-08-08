---
title: Task templates
description: Create a task from an Asana task template instead of rebuilding it subtask by subtask.
sidebar:
  order: 16
---

A task template is a saved task — description, subtasks, assignees, custom fields — that a
project keeps for work it does repeatedly: a release checklist, an incident postmortem, a
code-review ritual. Instantiating one creates the whole structure in a single call.

```sh
cyber-asana task-template list --project-gid <project-gid>
cyber-asana task-template get <gid>
cyber-asana task-template instantiate <gid> --name "Release 1.2"
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--project-gid <gid>` / `--project <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |
| `instantiate` | `<gid>` | `--name <name>`, `--no-wait`, `--timeout <seconds>` |

Task templates are always scoped to a project — Asana has no workspace-wide listing, so
`list` requires a project GID.

## Instantiating is asynchronous

Asana answers `instantiate` with a **job**, not the task: the record is built in the
background. The command polls that job for up to `--timeout` seconds (default 10, one
request per second) and prints the created task once the job succeeds.

```sh
$ cyber-asana task-template instantiate 1234 --name "Release 1.2"
Task      Release 1.2
Task ID   9876
Job       5555
Status    succeeded

Next steps:
  - cyber-asana task get 9876 — view the created task
```

Two ways to skip the wait:

- `--no-wait` returns the job immediately, still `in_progress`.
- `--timeout <seconds>` bounds the polling.

Either way you get the job record back rather than an error, so a slow instantiation still
hands you a job GID:

```sh
$ cyber-asana task-template instantiate 1234 --no-wait --json
{
  "gid": "5555",
  "resource_type": "job",
  "status": "in_progress"
}
```

A job that comes back `failed` exits non-zero with the job GID in the message.

## Deleting templates

Not supported. cyber-asana wraps *using* templates, not managing them — create and delete
templates in the Asana app.
