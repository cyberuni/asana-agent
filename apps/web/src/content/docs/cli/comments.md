---
title: Comments
description: Read and post comments (Asana stories) on tasks, with optional templating.
sidebar:
  order: 5
---

`comment` is an alias for `story` — the two commands are identical, so use whichever reads
better in your script.

```sh
cyber-asana comment list --task <gid>
cyber-asana comment create "Great work!" --task <gid>

# Equivalent
cyber-asana story list --task <gid>
cyber-asana story create "Great work!" --task <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--task-gid <gid>` / `--task <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `create` | `[text]` | `--task-gid <gid>` / `--task <gid>`, `--html-text <html>`, `--template` |

Comment bodies are truncated in list output with a size hint; pass `--full` for the
complete text.

## Rich text

```sh
cyber-asana comment create --task <gid> \
  --html-text '<body>Deployed to <strong>staging</strong>.</body>'
```

## Templating

`--template` interpolates task data into the text before posting, so you can write one
message and reuse it across tasks:

```sh
cyber-asana comment create \
  "Hey {task.assignee}, your task '{task.name}' is due {task.due_on}. Please update!" \
  --task <gid> --template
```

Supported variables: `{task.name}`, `{task.assignee}`, `{task.due_on}`, `{task.notes}`.

Without `--template`, braces are posted literally.
