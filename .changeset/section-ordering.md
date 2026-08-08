---
"cyber-asana": minor
---

Add section reordering and section-scoped task placement. `cyber-asana section move <gid> --project <gid> --insert-before|--insert-after <section-gid>` moves a section relative to another in the same project, and `cyber-asana section task add <section-gid> <task-gid>` places a task directly into a section. Both are also exposed over MCP as `asana_section_move` and `asana_section_task_add`.
