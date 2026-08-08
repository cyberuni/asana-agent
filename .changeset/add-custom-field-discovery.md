---
"cyber-asana": minor
---

Add custom field discovery so the GIDs that task writes are keyed by are reachable.

`custom-field list --workspace-gid <gid>` / `asana_custom_field_list` lists a workspace's
custom fields, and `custom-field get <gid>` / `asana_custom_field_get` returns one field
including its `enum_options` and their GIDs. Those are the values `task create` and
`task update` expect in `--custom-field` and `--custom-fields-json`.

Reads only — defining or editing custom fields is not wrapped.
