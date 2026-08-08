# Contributing

Guide for developing `cyber-asana` locally. AI coding assistants should also read [AGENTS.md](AGENTS.md).

## Setup

```sh
pnpm install
export ASANA_TOKEN=<your-pat>              # required for system tests
export ASANA_WORKSPACE=<workspace-gid>     # optional default workspace
```

## Build and test

```sh
pnpm verify       # typecheck + lint + test + build
pnpm dev task list --project <gid>        # run CLI without building (tsx)
pnpm test:system  # live API tests (requires ASANA_SYSTEM_TEST=1)
```

See [AGENTS.md](AGENTS.md) for the full command list, architecture, and conventions.

## MCP server

When working in this source tree, `import('cyber-asana/mcp')` does not resolve — there is no `node_modules/cyber-asana` self-link. Build first, then point MCP hosts at `dist/mcp.js`.

```sh
pnpm build
```

| Context | `command` | `args` |
| --- | --- | --- |
| MCP host (Cursor, Claude Desktop, etc.) | `node` | `["dist/cli.js", "mcp"]` or `["dist/mcp.js"]` |
| MCP Inspector | `node` | `["dist/cli.js", "mcp"]` — see [MCP Inspector](readme.md#mcp-inspector) |

### Cursor

In `~/.cursor/mcp.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cyber-asana": {
      "command": "node",
      "args": ["/absolute/path/to/cyber-asana/dist/mcp.js"],
      "env": {
        "ASANA_TOKEN": "${ASANA_TOKEN}",
        "ASANA_WORKSPACE": "${ASANA_WORKSPACE}"
      }
    }
  }
}
```

Reload MCP servers after changes.

**Dual MCP:** Both the official Asana OAuth MCP and cyber-asana can run together with separate config keys and credentials. Routing guidance is in [readme.md — Using alongside official Asana MCP](readme.md#using-alongside-official-asana-mcp).

### Gap analysis vs the official MCP

The docs site's [cyber-asana vs official Asana MCP](https://cyberuni.github.io/cyber-asana/reference/mcp-comparison/) page reports tool counts, overlap pairs, and gaps. Those numbers come from `tools/gap-analysis`, which extracts cyber-asana's tools from `packages/cyber-asana/src/**/mcp.ts` and diffs them against a checked-in snapshot of Asana's documented tool list.

```sh
cd tools/gap-analysis
pnpm fetch-official   # refresh data/official-asana-mcp-baseline.json
pnpm catalog          # re-extract cyber-asana's tools
pnpm report           # print the gap report
```

Regenerate and update the comparison page whenever MCP tools are added or removed, or when Asana publishes new ones. `pnpm check` fails if the checked-in catalog has drifted from the source.

### MCP Inspector

Debug tools and schemas without an agent host. UI defaults to [http://localhost:6274](http://localhost:6274).

```sh
pnpm build
npx @modelcontextprotocol/inspector \
  -e ASANA_TOKEN="$ASANA_TOKEN" \
  -e ASANA_WORKSPACE="$ASANA_WORKSPACE" \
  -- node dist/cli.js mcp
```

Consumer MCP setup (installed package) is documented in [readme.md](readme.md#mcp-server).
