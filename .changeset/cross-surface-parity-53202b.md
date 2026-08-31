---
'cyber-asana': minor
---

Close the cross-surface gaps in the goals and status domains: `goal create` / `goal update` gain `--start-on` and `--html-notes`, `goal update` gains `--clear-due-on` and `--clear-start-on`, and `status list` gains `--created-since`. The matching MCP parameters land on `asana_goal_create`, `asana_goal_update`, and `asana_status_list`.

Asana has always taken `start_on` and `html_notes` on both goal write endpoints and `created_since` on the status listing, but none of the three had a CLI or MCP surface. A goal's date range could only be half-set, a goal description could only be plain text, and asking what was posted since the last check-in meant paging the whole status history and filtering locally.

Both goal dates are nullable, so unsetting one needs its own input — `--clear-due-on` and `--clear-start-on` send an explicit null, the way `task update` already does. Naming a date together with its clear flag, or `--notes` together with `--html-notes`, is a usage error caught locally before any request is sent.

The custom-fields domain was swept for the same class of gap and is clean: every parameter the Asana SDK accepts on its six implemented operations is already reachable from both surfaces.
