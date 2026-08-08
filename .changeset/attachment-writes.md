---
"cyber-asana": minor
---

Attach and remove files. `attachment create` uploads a local file — streamed, not
buffered — or links an external URL with `--url`, and `attachment delete` removes an
attachment idempotently. The MCP server gains `asana_attachment_create` and
`asana_attachment_delete`; its `file` path is resolved on the machine running the server.

`attachment list` and `asana_attachment_list` now accept `--parent-gid` / `parent_gid` for
a project or project brief as well as a task. `--task-gid` and `task_gid` keep working.
