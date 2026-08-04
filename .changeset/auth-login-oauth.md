---
"cyber-asana": minor
---

Add `cyber-asana auth login` — OAuth authorization through the browser.

cyber-asana authenticates against **your own** Asana app rather than a shipped
registration, so no third party's OAuth app sits between you and your data. Set
`ASANA_CLIENT_ID` / `ASANA_CLIENT_SECRET` (or write them to `settings.json`) and
run `auth login`. The consent redirect is caught by a one-shot server bound to
`127.0.0.1` — the authorization code arrives in a query string, so nothing off
the machine can reach the socket that receives it. PKCE and `state` are used
throughout.

Credentials are stored under `$XDG_CONFIG_HOME/cyber-asana`, split by owner:
`settings.json` is yours and hand-edited, `credentials.json` is the CLI's and
rewritten on every refresh. Both are `0600`.

`--no-store` runs the flow and prints the access token instead of saving it,
for one-off shells and CI. It emits only the hour-long access token; the
long-lived refresh token needs `--include-refresh-token`. `--raw` prints the
bare token for `$(...)` substitution.

A personal access token remains the documented happy path for a single user.
