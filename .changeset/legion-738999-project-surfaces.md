---
'cyber-asana': minor
---

Close cross-surface gaps in the projects and project-templates domains.

- `project list` gains `--archived` / `--no-archived`, and `asana_project_list` gains
  `archived`. The gateway had threaded Asana's `archived` filter all along; neither
  surface exposed it.
- `project create` / `project update` gain `--archived` (and `--no-archived` on update),
  and `asana_project_create` / `asana_project_update` gain `archived`. Asana has accepted
  `archived` on both endpoints all along; no surface could archive a project.
- `project create` / `project update` gain `--owner`, `project update` gains
  `--clear-owner`, and the matching MCP tools gain `owner` / `clear_owner`. Asana's
  nullable `owner` had no setter on any surface.
