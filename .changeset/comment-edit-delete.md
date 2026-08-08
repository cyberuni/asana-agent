---
"cyber-asana": minor
---

Read, edit, and delete comments. `story get|update|delete` and `comment get|update|delete`
join the CLI, with matching `asana_story_*` and `asana_comment_*` MCP tools, so a comment
posted by mistake can be corrected or withdrawn. Asana only permits changing comment
stories you authored — a refusal now carries a `hint` explaining that instead of a bare
`403` — and `delete` is idempotent.
