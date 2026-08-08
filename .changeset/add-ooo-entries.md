---
"cyber-asana": minor
---

Add out-of-office entries, so automation can see who is away before it assigns work.

- CLI: `ooo list|get|create|update|delete`, with `--start-date` / `--end-date` filters on the list.
- MCP: `asana_ooo_list`, `asana_ooo_get`, `asana_ooo_create`, `asana_ooo_update`, `asana_ooo_delete`.
- `--user-gid` / `user_gid` defaults to the authenticated user, so an unscoped call reads your own calendar.
- `user list`, `user get`, and `user me` now suggest the matching `ooo list` call.
