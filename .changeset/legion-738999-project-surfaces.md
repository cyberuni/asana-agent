---
'cyber-asana': minor
---

Close cross-surface gaps in the projects and project-templates domains.

- `project list` gains `--archived` / `--no-archived`, and `asana_project_list` gains
  `archived`. The gateway had threaded Asana's `archived` filter all along; neither
  surface exposed it.
