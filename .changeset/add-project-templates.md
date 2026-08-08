---
"cyber-asana": minor
---

Start a project from a project template: new CLI resource `cyber-asana project-template list|get|instantiate` and MCP tools `asana_project_template_list`, `asana_project_template_get`, `asana_project_template_instantiate`. `list` scopes to a workspace or, with `--team-gid`/`team_gid`, to a team's templates; `get` shows the template's `requested_dates`, the date variables instantiation fills in via `--requested-date <gid>=<YYYY-MM-DD>` / `requested_dates`.

Asana builds the project asynchronously, so instantiation returns a job. `instantiate` waits for that job by default and reports the new project's GID under a bounded timeout (`--timeout` / `timeout_seconds`, default 60 seconds, polling every `--poll-interval` seconds); `--no-wait` / `wait: false` returns the job GID for callers that poll themselves. A failed job and an expired wait are both errors — never a success with a missing project GID.

Also wraps the Jobs API that polling needs: `cyber-asana job get <gid>` and `asana_job_get`.
