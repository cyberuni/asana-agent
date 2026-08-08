---
"cyber-asana": minor
---

Add cross-object search backed by Asana's typeahead endpoint, so a name can be turned into a GID without the official Asana MCP server: new MCP tool `asana_search_objects` and CLI command `cyber-asana search objects <resource-type> [query]`. One resource type per call (`actor`, `agent`, `custom_field`, `goal`, `portfolio`, `project`, `project_template`, `tag`, `task`, `team`, `user`), a single page capped by `--count`/`count` (1–100, default 20), and no pagination — results are ordered by relevance/recency and are explicitly not exhaustive.
