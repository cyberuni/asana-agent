---
title: Events
description: Poll Asana's change feed for a task, project, or goal instead of re-querying and diffing state.
sidebar:
  order: 16
---

`event list` answers "what changed here since I last looked?" in one call. Every other
command reports current state; this one reports the changes themselves — including the ones
current state no longer preserves, like a task moved between sections, a field edited and
edited back, or a comment added and deleted.

```sh
cyber-asana event list <project-gid>                  # first call — returns a token, no events
cyber-asana event list <project-gid> --sync <token>   # changes since that token
```

| Command | Arguments | Options |
| --- | --- | --- |
| `list` | `<resource-gid>` | `--sync <token>`, `--opt-fields <fields>` |

The resource can be a task, project, or goal. A subscription to a project returns events for
the tasks inside it, so the resource that triggered an event may differ from the one you
asked about.

## The sync token

The feed is cursored by a **sync token**, not by an offset. Each response carries the token
to use next time, and you pass it back on the following call:

```sh
$ cyber-asana event list 12345
Sync token established for 12345. No events are returned on this call.

Sync token: eyJ0b2tlbiI6...

Next steps:
  - cyber-asana event list 12345 --sync eyJ0b2tlbiI6... — changes since this call
```

Nothing is stored locally — the token lives in the response, the same way pagination
offsets do. Keep it wherever the rest of your polling state lives.

## First run and expiry

Asana answers a call with no sync token — or with one that has aged out — with a `412` that
hands back a fresh token instead of events. That is the documented way to say "start here",
so cyber-asana treats it as a normal path rather than an error:

```json
{ "data": [], "sync": "eyJ0b2tlbiI6...", "has_more": false, "sync_reset": true }
```

`sync_reset: true` is the signal that the window was reset. It is not the same as an empty
result: `sync_reset: false` with an empty `data` means the token was valid and genuinely
nothing changed. Text mode keeps the two apart too — the reset prints "Sync token
established", a real empty result prints `0 events found`.

Expired tokens land in exactly the same place. Treat a `sync_reset` as "I lost the window,
re-establish and carry on", not as a failure to retry.

## More than one page of changes

Asana caps a single sync token at 100 events. When more are waiting, the response sets
`has_more: true` and you should poll again immediately with the returned token rather than
waiting for the next interval:

```sh
cyber-asana event list <project-gid> --sync <token> --json
```

```json
{ "data": [ ... ], "sync": "eyJ0b2tlbiI6...", "has_more": true, "sync_reset": false }
```

Unlike list commands, this is not `--all`-able: each fetch depends on the token the previous
one returned, so the pages cannot be gathered in parallel.

## Fields

The feed does not set a default `opt_fields`. Asana's default event record is already small
and already carries the parts that make an event meaningful — `action`, `created_at`,
`resource`, `user`, `change`, and `parent` — and narrowing it would drop the `change` detail
the feed exists to expose. Pass `--opt-fields` when you want something different.

## Why not webhooks

Asana's push alternative needs a public HTTPS endpoint to receive callbacks, which a local
stdio MCP server and a terminal CLI structurally cannot provide. Polling this feed is the
change-detection primitive that works from where cyber-asana runs.
