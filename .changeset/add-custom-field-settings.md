---
"cyber-asana": minor
---

Add the custom field settings reads — which custom fields are attached to a given project, portfolio, goal, or team. New CLI subcommands `cyber-asana custom-field <project|portfolio|goal|team> <gid>` and four MCP tools: `asana_custom_field_list_for_project`, `asana_custom_field_list_for_portfolio`, `asana_custom_field_list_for_goal`, `asana_custom_field_list_for_team`.

`custom-field list` covers every field in the workspace; this is the narrower answer, and usually the one you want before writing `custom_fields` on a task. Asana rejects a payload naming a field the project does not have, so a project-scoped list — each field with its type and enum options — answers "what can I set here, and with which values". The default `opt_fields` requests exactly the field GID, name, resource subtype, and enum option GIDs and names.

Reads only. Attaching or detaching a custom field lives on the Projects API and is administration; it stays out.
