---
"cyber-asana": minor
---

Read the OAuth app registration from `ASANA_API_CLIENT_ID` and `ASANA_API_CLIENT_SECRET`, which now take precedence over `ASANA_CLIENT_ID` and `ASANA_CLIENT_SECRET`.

Asana's official hosted MCP server documents `ASANA_CLIENT_ID`/`ASANA_CLIENT_SECRET` for its own "MCP app" registration, whose tokens do not work against the REST API. `cyber-asana auth login` needs an "API app" instead, so the two can now be exported side by side. `ASANA_CLIENT_ID`/`ASANA_CLIENT_SECRET` still work as a fallback, and `--client-id`/`--client-secret` still win over both.
