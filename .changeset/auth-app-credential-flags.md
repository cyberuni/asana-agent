---
"cyber-asana": minor
---

Accept `--client-id` and `--client-secret` on `auth login`, `auth token`, and
`auth logout`, so trying OAuth needs no edits to a shell profile or
`settings.json`. Precedence is flags > `ASANA_CLIENT_ID` / `ASANA_CLIENT_SECRET`
> `settings.json`, resolved per field, and `auth status` continues to name the
source that won.

A secret passed as an argument is captured by shell history and visible in the
process list, so the flag help and the readme both point at the environment
variables for ongoing use.
