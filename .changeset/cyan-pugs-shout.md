---
'cyber-asana': patch
---

Ship a `SETUP.md` at the plugin root so an agent can finish plugin setup — the Asana personal access token and workspace GID its bundled MCP server reads from the environment — without re-deriving the MCP wiring the install already did.
