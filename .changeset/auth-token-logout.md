---
"cyber-asana": minor
---

Add `cyber-asana auth token` and `cyber-asana auth logout`.

`auth token` prints the stored access token for piping into other tools, and
refreshes it first when it is within a minute of expiring — so what it prints
is always usable, and the refreshed token is persisted rather than discarded.
Text output is the bare token and nothing else, so `$(...)` substitution works.

`auth logout` revokes the grant with Asana and then deletes the local
credentials. The order is load-bearing: Asana revokes only refresh tokens, so
once the file is gone there is nothing left to revoke with. If revocation
fails the credentials are still deleted and the output says the grant may
still be live, with the link to remove it. `--local` skips revocation, and
logging out twice reports "not logged in" rather than failing.
