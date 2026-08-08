---
"cyber-asana": minor
---

Add project and team membership management over Asana's unified Memberships endpoint: CLI `cyber-asana membership list|get|create|update|delete` and MCP tools `asana_membership_list`, `asana_membership_get`, `asana_membership_create`, `asana_membership_update`, `asana_membership_delete`. Agents can now answer "who is on this project?", check an assignee actually has access, and add or remove a member as part of an onboarding flow — `user list` only ever gave the whole workspace.

`list` filters by parent (project, portfolio, goal, custom type, or custom field) and/or member (user or team); Asana needs `--resource-subtype` / `resource_subtype` when the parent is omitted, and the CLI reports any other combination as a usage error instead of a 400. `update` changes `--access-level` only — broader permission management is Asana's Roles API and stays out of scope. `delete` is idempotent.
