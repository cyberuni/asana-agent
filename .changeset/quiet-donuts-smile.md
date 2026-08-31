---
'cyber-asana': minor
---

Add `--start-on` and `--clear-start-on` to `task update`, and the matching `start_on` / `clear_start_on` parameters to the `asana_task_update` MCP tool.

Asana's task `start_on` field had no CLI or MCP surface on update, so setting a task's date range meant falling back to the raw API. `cyber-asana task update <gid> --start-on 2026-09-01 --due-on 2026-10-31` now sets both, and `--clear-start-on` sends an explicit null the way `--clear-due-on` does. Naming both `--start-on` and `--clear-start-on` is a usage error caught before any request is sent.
