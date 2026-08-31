---
title: Attachments
description: List, inspect, upload, and delete the files attached to an Asana task, project, or project brief.
sidebar:
  order: 10
---

Attachments hang off a task, a project, or a project brief.

```sh
cyber-asana attachment list --parent-gid <gid>
cyber-asana attachment get <gid>
cyber-asana attachment create ./sprint-report.md --parent-gid <task-gid>
cyber-asana attachment create --url https://example.com/design --parent-gid <task-gid> --name "Design doc"
cyber-asana attachment delete <gid>
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | — | `--parent-gid <gid>` / `--task-gid <gid>`, [pagination](/cyber-asana/cli/#pagination) |
| `get` | `<gid>` | — |
| `create` | `[file]` | `--parent-gid <gid>`, `--url <url>`, `--name <name>`, `--connect-to-app` |
| `delete` | `<gid>` | — |

`get` returns the attachment's metadata and its download URL. Asana's download URLs are
short-lived, so fetch one just before you use it.

`create` takes either a local file path or `--url`, never both. A file is streamed rather
than read into memory, and its name defaults to the basename of the path; a `--url`
attachment is stored as an external link, and its name defaults to the URL. Asana enforces
a 100 MB limit on uploads.

`--connect-to-app` sets Asana's `connect_to_app`, which links the authenticated app to an external
attachment so Asana can show its app-components widget. Asana honours it only for a `--url`
attachment on a task, and only under an OAuth token (`cyber-asana auth login`), so naming it with a
file upload is a usage error caught before any request is sent.

`delete` is idempotent — deleting an attachment that is already gone succeeds and reports
`already_absent: true` rather than failing with a 404.
