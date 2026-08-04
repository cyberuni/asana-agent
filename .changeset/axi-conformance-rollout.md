---
"cyber-asana": minor
---

Roll the agent-friendly output conventions out from the `tasks` domain to the
whole CLI, and fix two contract violations.

Fixes:

- **Mutation acknowledgements honor `--json`/`--toon`.** Deletes and relationship
  mutations across tasks, projects, goals, tags, sections, status, and portfolios
  printed prose regardless of the requested format. All 15 sites now emit a
  structured payload.
- **The `Next offset:` hint is gated to text mode**, like the summary and
  next-step helpers.

Rollout:

- **Minimal default schemas** — every list command now requests a small default
  field set when the caller gives no `--opt-fields`.
- **Count summaries and next-step hints** on every list command, not just tasks.
- **Truncation** applies to project notes, status update bodies, and comment
  bodies, so the documented `--full` flag is meaningful beyond task notes.
- **Empty states name the entity** — `0 tasks found` rather than a bare
  `0 results`.
- **Self-correcting usage errors** — an unknown flag or subcommand now reports
  the flags that command accepts plus a `--help` pointer, and exits `2`.
- **Idempotent deletes** — deleting something already gone succeeds and reports
  `already_absent: true` instead of failing with a 404.
- **Usage examples in every resource group's `--help`**, and `bin`,
  `description`, and `version` lines on the bare-invocation home view.
- **New `cyber-asana setup hook`** installs a SessionStart hook so an agent
  session opens with live Asana context. Installing twice is a no-op.
