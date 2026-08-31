---
'cyber-asana': minor
---

`auth status` accepts `--client-id` and `--client-secret`

The flags already reached `auth login`, `auth token`, and `auth logout`, but the one command that explains which app registration wins could not see them. `cyber-asana auth status --client-id <id>` now reports the registration a given pair would resolve to, and which sources it shadows, before you authorize with it.
