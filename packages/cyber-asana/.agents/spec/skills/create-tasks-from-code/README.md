---
spec-type: reference
concept: [cyber-asana, skills, todo-scan, tasks]
---

# create-tasks-from-code — the TODO-sweep skill

A **reference artifact**: the shipped skill at `packages/cyber-asana/skills/create-tasks-from-code/`,
which turns `TODO` and `FIXME` comments in a codebase into tracked Asana tasks.

## Subject

- **Artifact** — `skills/create-tasks-from-code/SKILL.md`. No references directory.
- **Trigger** — the user wants code TODOs tracked in Asana, or a sweep to surface technical debt.
  Its front block reads: *"Use this skill when scanning code for TODO/FIXME comments and creating
  actionable Asana tasks from them."*
- **What it covers** — scanning with `task scan-todos`, **filtering** the hits into actionable work
  versus noise, **deduplicating semantically** against the tasks already in the project, presenting
  the filtered list for approval, and only then creating tasks.

**Its place in the catalog.** It is the one skill whose failure mode is *volume*. A scan of any real
codebase returns hundreds of rows, most of them noise — test fixtures, generated comments, notes
that were resolved years ago. So three of its five steps exist to throw results away, and the
confirm-before-creating step is not politeness: creating a hundred tasks is far harder to undo than
declining to.

Its dedup instruction is deliberately **semantic, not textual** — "Fix auth timeout" and
"TODO: fix auth timeout" are the same item — because a string comparison would let the same debt be
filed on every sweep.

**What it adopts.** The catalog contract in [skills](../README.md).

**What decides its behavior lives elsewhere.** The scan itself and the task creation are
[tasks](../../tasks/README.md); the output format is [axi](../../axi/README.md). Whether the filter
keeps the right rows and the dedup catches the right pairs is a graded judgment on a model's
selection — ACED's.
