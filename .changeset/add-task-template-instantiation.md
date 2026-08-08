---
"cyber-asana": minor
---

Add task templates: `cyber-asana task-template list|get|instantiate` and the `asana_task_template_list`, `asana_task_template_get`, `asana_task_template_instantiate` MCP tools. A recurring checklist — a release checklist, an incident postmortem — is created in one call instead of rebuilt subtask by subtask. `list` is project-scoped, as Asana requires.

Asana instantiates a task asynchronously and answers with a job, so `instantiate` polls that job for up to `--timeout` seconds (`timeout_seconds`, default 10) and returns it carrying `new_task` once it succeeds. `--no-wait` / `wait: false` returns the pending job immediately; a timeout returns the last job seen rather than erroring, so you always get a job GID back. On the CLI a `failed` job exits non-zero.

Deleting a template is deliberately not wrapped — cyber-asana wraps using templates, not managing them.
