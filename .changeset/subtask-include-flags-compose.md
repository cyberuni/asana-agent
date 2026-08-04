---
"cyber-asana": patch
---

Fix `task subtask list` include flags (`--assignee-email`, `--follower-emails`,
`--num-subtasks`, `--custom-fields`) suppressing the default `gid,name,completed,due_on`
field set, which left the Name/Done/Due columns blank. The flags now add to the field
set — the caller's `--opt-fields` when given, the default when not.
