---
'cyber-asana': minor
---

`portfolio list` gains an owner filter on both surfaces. The `owner` parameter was already threaded
through the portfolios gateway and `api.ts` and sent to Asana, but neither caller could set it:
the CLI now takes `--owner-gid <gid>` (legacy alias `--owner`) and `asana_portfolio_list` now takes
`owner_gid`. Asana honors the filter for service-account tokens; a regular personal access token
lists only its own portfolios either way. When no owner is given, no `owner` key is sent.
