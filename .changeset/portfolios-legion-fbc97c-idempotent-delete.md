---
'cyber-asana': minor
---

`asana_portfolio_delete` is now idempotent, like every other delete in the package. It was the one
delete calling Asana bare, so deleting a portfolio that was already gone handed the agent a 404 while
the same retry on `cyber-asana portfolio delete` reported it as already deleted. The tool now returns
the shared acknowledgement — `{ deleted, resource, gid, already_absent }` — instead of a fixed
`Deleted portfolio <gid>` sentence.
