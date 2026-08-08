---
"cyber-asana": minor
---

Add a deterministic status roll-up: `cyber-asana status overview <parent-gid>` and the `asana_status_overview` MCP tool. Given a project GID it returns that project's latest status update and its task counts; given a portfolio GID it also returns one entry per item. It takes a GID and never searches — discovery by keyword stays with the official Asana MCP's `get_status_overview`.

A portfolio roll-up costs `3 + 2N` API calls for N items. `--limit` / `limit` caps N (default 25) and a capped roll-up reports `truncated` rather than silently dropping items. `--parent-type` / `parent_type` skips parent detection and saves one call.
