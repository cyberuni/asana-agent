---
"cyber-asana": minor
---

Add `cyber-asana auth status` — a credential diagnostic that works when the
credential does not.

`user me` answers "who am I to Asana?" and needs a working token to answer at
all. `auth status` answers "what will this process authenticate with?", so it
reads local state only, never calls the API, and exits `0` even when nothing is
configured (`authenticated: false`). When an agent hits a `401`, this is the
command that still responds.

It names the winning source (`--token` > `ASANA_ACCESS_TOKEN` > `ASANA_TOKEN`)
and lists the sources being shadowed — a stale env var silently overriding a
newer one was previously indistinguishable from a bad token. Tokens are shown
masked, in text, `--json`, and `--toon`.
