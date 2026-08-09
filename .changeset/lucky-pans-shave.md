---
'cyber-asana': minor
---

Distribute the agent plugin inside the npm package.

The published package root is now the plugin root: the tarball carries
`plugin.json`, `mcp.json`, `skills/`, and the Claude Code, Cursor, and Codex
manifests alongside `dist/`. Claude Code can install it from a marketplace with
an `npm` source — `/plugin marketplace add cyberuni/cyber-asana` then
`/plugin install cyber-asana@cyberuni` — instead of cloning the repo.

The portable `plugin.json` and `mcp.json` follow [Agent Plugins
1.0.0](https://github.com/agentplugins/agent-plugins-spec), whose manifest
schema is closed; skills and MCP servers are discovered from fixed locations
rather than declared inline.

**Note for spec-conformant clients:** `mcp.json` no longer sets an `env` block.
The spec expands only `${PLUGIN_ROOT}` and `${PLUGIN_DATA}`, so the previous
`"ASANA_ACCESS_TOKEN": "${ASANA_ACCESS_TOKEN}"` entry would arrive as that
literal string and shadow the real token. Export `ASANA_ACCESS_TOKEN` (and
optionally `ASANA_WORKSPACE_GID`) in the environment that launches the agent.

Claude Code reads `.mcp.json`, which still expands `${VAR}`, so a configured
token keeps working unchanged.

Independently, an environment value that is exactly an unexpanded reference —
`${ASANA_ACCESS_TOKEN}` — is now treated as unset rather than as a credential.
Hosts that cannot expand a reference forward its text verbatim, and Claude Code
does the same when the variable is unset and has no default. That literal
previously outranked the `ASANA_TOKEN` fallback and turned a missing token into
a `401`; a missing credential is now reported as missing.

`auth status` names any variable in that state under `Unexpanded`, in both text
and JSON output, so a variable that looks configured everywhere the user checks
does not read as an unexplained "not authenticated".
