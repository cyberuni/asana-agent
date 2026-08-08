---
"cyber-asana": minor
---

Report the OAuth app registration in `cyber-asana auth status`: an `App` line with the masked client id and its source, plus `App ignored` for registrations it shadows (an `app` object with `client_id_masked`, `source`, and `shadowed` under `--json` / `--toon`, `null` when none resolves). The command stays offline.

When Asana rejects the token request with `invalid_client`, append a hint about the API-app / MCP-app distinction and `ASANA_API_CLIENT_ID` to Asana's own message.
