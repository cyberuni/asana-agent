# Dual MCP reference

Run the [official Asana MCP](https://developers.asana.com/docs/mcp-tools-reference) and cyber-asana together. Tool names differ (`create_tasks` vs `asana_task_create`); use separate **config keys** — `"asana"` for official, `"cyber-asana"` for this package.

| Server | Config key | Auth | Env vars |
| --- | --- | --- | --- |
| Official Asana MCP | `asana` | OAuth 2.0 (hosted, **MCP app** you register) | `ASANA_CLIENT_ID`, `ASANA_CLIENT_SECRET` (Asana's documented names) |
| cyber-asana | `cyber-asana` | Personal access token, or OAuth 2.0 + PKCE via `cyber-asana auth login` (your own **API app**) | `ASANA_ACCESS_TOKEN`, optional `ASANA_WORKSPACE_GID`; for OAuth, `ASANA_API_CLIENT_ID` / `ASANA_API_CLIENT_SECRET` |

**Credentials are not interchangeable — neither the tokens nor the app registrations.**

Asana's hosted MCP server does not support dynamic client registration, so you pre-register an app of type **MCP app** ([integrating](https://developers.asana.com/docs/integrating-with-asanas-mcp-server), [connecting](https://developers.asana.com/docs/connecting-mcp-clients-to-asanas-v2-server)). Asana states that tokens issued for MCP apps only work with the MCP server, and that standard API requests need a separate **API app**.

- **Tokens** — MCP OAuth tokens from the official server cannot be used as `ASANA_ACCESS_TOKEN`. PATs cannot substitute for official MCP OAuth.
- **Client ids and secrets** — an MCP app's pair cannot drive `cyber-asana auth login`, which needs an API app's. Asana documents the MCP app's pair under `ASANA_CLIENT_ID` / `ASANA_CLIENT_SECRET`, so one exported pair cannot serve both. Give cyber-asana its API app through `ASANA_API_CLIENT_ID` / `ASANA_API_CLIENT_SECRET` (names cyber-asana defines) or `~/.config/cyber-asana/settings.json`, and keep the official server's pair in the host config's `auth` block.

Dual-config example (Cursor-style):

```json
{
  "mcpServers": {
    "asana": {
      "url": "https://mcp.asana.com/v2/mcp",
      "auth": {
        "CLIENT_ID": "${env:ASANA_CLIENT_ID}",
        "CLIENT_SECRET": "${env:ASANA_CLIENT_SECRET}"
      }
    },
    "cyber-asana": {
      "command": "node",
      "args": ["-e", "import('cyber-asana/mcp')"],
      "env": {
        "ASANA_ACCESS_TOKEN": "${ASANA_ACCESS_TOKEN}",
        "ASANA_WORKSPACE_GID": "${ASANA_WORKSPACE_GID}"
      }
    }
  }
}
```

**Which server to use:**

| Prefer official `asana` | Prefer `cyber-asana` |
| --- | --- |
| `search_objects`, `get_status_overview` | `asana_url_parse`, repo config (`.agents/cyber-asana.json`) |
| Interactive previews (`create_task_preview`, etc.) | Subtasks, dependencies, followers, section placement |
| New MCP-only capabilities Asana ships first | `asana_task_scan_todos`, `asana_project_export`, rich REST-backed writes |

Default: official for discovery/status; cyber-asana for write-heavy automation.
