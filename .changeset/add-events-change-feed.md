---
"cyber-asana": minor
---

Add the Asana change feed: `cyber-asana event list <resource-gid>` and the `asana_event_list` MCP tool report what changed on a task, project, or goal since a sync token, instead of re-querying and diffing state.

The sync token is returned in the response and passed back with `--sync` / `sync` on the next call — nothing is cached locally. The first call (or one with an expired token) returns no events, a fresh token, and `sync_reset: true`; that is Asana's documented "start here" handshake, not an error. When `has_more` is `true`, poll again immediately — Asana caps one token at 100 events.
