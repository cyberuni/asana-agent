---
'cyber-asana': minor
---

Close the cross-surface field gaps in the `tasks` domain, so the CLI and MCP expose what Asana's task endpoints have always accepted.

- `task create` gains `--start-on` and `--completed`; `asana_task_create` gains `start_on` and `completed`. Both were settable on update but not create, even though Asana's create body takes them.
- `task create` and `task update` gain `--due-at` and `--start-at`, and `task update` gains `--clear-due-at` and `--clear-start-at`. `task search` already filtered on the due *time*, so tasks with one were findable but not writable. A date paired with its date-time twin is a usage error caught locally, because Asana documents the two forms as not to be used together.
- `task update` gains `--clear-assignee` (`clear_assignee` on `asana_task_update`) — `assignee` is nullable, but it was the one nullable field the command wrote with no clear counterpart, so unassigning a task was not expressible.
- `task subtask create` and `asana_task_subtask_create` now take the same write fields as their `task create` siblings — rich notes, start dates, resource subtype, custom fields, and followers all previously fell off at the gateway. Callers of the programmatic `createSubtask` should note its options change from camelCase (`{ notes, assignee, dueOn }`) to the shared `CreateTaskFields` shape (`{ notes, assignee, due_on, ... }`).
