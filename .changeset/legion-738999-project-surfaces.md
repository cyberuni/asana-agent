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
- `project create` / `project update` gain `--default-access-level`, and the matching
  MCP tools gain `default_access_level`. Its sibling `privacy_setting` was already
  exposed on both surfaces.
- `project-template instantiate` gains `--privacy-setting` and
  `asana_project_template_instantiate` gains `privacy_setting`. Both surfaces exposed only
  the `public` boolean, which Asana deprecated in favour of `privacy_setting`.
- `project-template instantiate` gains `--strict-dates` and
  `asana_project_template_instantiate` gains `is_strict`. Asana's `is_strict` turns an
  unfilled date variable into an error rather than a silently defaulted date; neither
  surface could ask for it.
- `project-template instantiate` gains a repeatable `--requested-role` and
  `asana_project_template_instantiate` gains `requested_roles`. `requested_dates` was
  already plumbed on both surfaces; its role counterpart was not.
