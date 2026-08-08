---
title: Authentication
description: Personal access tokens, OAuth login, and inspecting which credential is in use.
sidebar:
  order: 12
---

cyber-asana accepts either a personal access token or an OAuth grant obtained through
`auth login`.

## Credential sources

Resolved in this order — the first one found wins:

1. `--token <token>` on the command
2. `ASANA_ACCESS_TOKEN` environment variable
3. `ASANA_TOKEN` environment variable
4. The stored OAuth credential from `cyber-asana auth login`

A personal access token is the simplest start — create one at
[app.asana.com → My Apps](https://app.asana.com/0/my-apps):

```sh
export ASANA_ACCESS_TOKEN="<pat>"
export ASANA_WORKSPACE="<workspace-gid>"   # optional, saves --workspace-gid everywhere
```

## Checking what is in use

```sh
cyber-asana auth status
```

Reports whether you are authenticated, which source won, the masked token, the account it
belongs to, expiry if any, and which other credentials were shadowed — all without calling
the Asana API. When nothing is configured it prints the two ways to fix that.

## OAuth login

```sh
cyber-asana auth login
cyber-asana auth login --no-store --raw
cyber-asana auth logout
```

`login` opens the browser, listens on a loopback callback, and stores the credential
locally.

| Option | Command | Description |
| --- | --- | --- |
| `--client-id <id>` | `login`, `logout` | OAuth client ID — overrides `ASANA_CLIENT_ID` and `settings.json` |
| `--client-secret <secret>` | `login`, `logout` | OAuth client secret (visible in shell history — prefer the env var) |
| `--no-store` | `login` | Print the token instead of saving it |
| `--include-refresh-token` | `login` | Also print the long-lived refresh token (implies `--no-store`) |
| `--raw` | `login` | Print only the token, for shell substitution |
| `--scope <list>` | `login` | Comma-separated scopes to request |
| `--manual` | `login` | Paste the code from the browser instead of listening for a redirect |
| `--redirect-uri <uri>` | `login` | Redirect URL registered for the app (default: the loopback URL) |
| `--port <port>` | `login` | Callback port |
| `--local` | `logout` | Delete local credentials without revoking the grant |

Use `--manual` when you are on a remote or headless machine where the browser cannot reach
the loopback listener.

## Printing the stored token

```sh
cyber-asana auth token
```

Prints the stored access token, refreshing it first when it is close to expiring. Useful
for handing a fresh token to another tool:

```sh
curl -H "Authorization: Bearer $(cyber-asana auth token)" \
  https://app.asana.com/api/1.0/users/me
```

:::caution
OAuth tokens from Asana's official MCP server are not interchangeable with these — they
cannot be used as `ASANA_ACCESS_TOKEN`, and a PAT cannot substitute for official MCP OAuth.
:::
