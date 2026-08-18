---
'cyber-asana': patch
---

Fix `task get-many --opt-fields` failing with HTTP 400 `Parameters are not
accepted in a batch action path`.

Each batch action built its `relative_path` as `/tasks/<gid>?opt_fields=<fields>`,
and Asana's Batch API rejects a query string there. The requested fields now ride
in the action's own `options.fields` array — where the Batch API schema puts
output options — and the path stays bare. Without `--opt-fields` no query string
was ever appended, which is why only the flag path failed.
