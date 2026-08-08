---
title: Repo config
description: Map project names to GIDs in a committed file so agents can resolve them without an API call.
sidebar:
  order: 13
---

A repository can commit a name → GID map at `.agents/cyber-asana.json`. Agents and MCP
tools then resolve a human-readable project name locally, with no API call and no guessing.

```json
{
  "schema_version": 1,
  "projects": [
    { "gid": "1215109751173511", "name": "cyber-asana" }
  ]
}
```

Workspace GID deliberately stays out of this file — keep it in `ASANA_WORKSPACE`.

## Commands

```sh
cyber-asana config add <project-gid>                  # seed or update an entry
cyber-asana config resolve-project "Backend" --json   # local lookup, no API call
cyber-asana config sync                               # refresh cached names from Asana
cyber-asana config show
```

| Command | Arguments | Description |
| --- | --- | --- |
| `show` | — | Print the repo config |
| `list` | — | Alias for `show` |
| `path` | — | Print the resolved config file path |
| `resolve-project` | `<name>` | Resolve a project name to its GID, no API call |
| `add` | `<project-gid>` | Add or update an entry, fetching the name from Asana |
| `remove` | `<gid-or-name>` | Remove an entry by GID or name |
| `sync` | — | Refresh all cached project names from Asana |

Every subcommand accepts `--config <path>`, which overrides the `CYBER_ASANA_CONFIG`
environment variable.

## Keeping names fresh

`add` and `sync` are the only commands that call Asana. Everything else reads the file.
Beyond those, `project get` and the `asana_project_get` MCP tool opportunistically update
cached names whenever a result includes both `gid` and `name`, so the map drifts less than
you would expect.

Run `config sync` after a batch of renames in Asana.

## Typical setup

```sh
cyber-asana config add <project-gid>
git add .agents/cyber-asana.json
```

Committing the file is the point — it is what lets a fresh agent session in a clone resolve
"the backend project" to a GID on the first try.
