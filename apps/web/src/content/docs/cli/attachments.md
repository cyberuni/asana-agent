---
title: Attachments
description: List and inspect the files attached to an Asana task.
sidebar:
  order: 10
---

Read-only. Attachments are listed per task.

```sh
cyber-asana attachment list --task <task-gid>
cyber-asana attachment get <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--task-gid <gid>` / `--task <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |

`get` returns the attachment's metadata and its download URL. Asana's download URLs are
short-lived, so fetch one just before you use it.

Uploading and deleting attachments are not wrapped — see
[API coverage](/cyber-asana/reference/api-coverage/).
