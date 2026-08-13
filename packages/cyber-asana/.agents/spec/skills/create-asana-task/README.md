---
spec-type: reference
concept: [cyber-asana, skills, tasks, resolution]
---

# create-asana-task — the task-filing skill

A **reference artifact**: the shipped skill at `packages/cyber-asana/skills/create-asana-task/`,
which turns "file this as a task" into a correctly-scoped Asana task.

## Subject

- **Artifact** — `skills/create-asana-task/SKILL.md`. No references directory.
- **Trigger** — the user asks to create, add, or file an Asana task. Its front block reads:
  *"Use this skill when the user asks to create, add, or file an Asana task via MCP or CLI."*
- **What it covers** — gathering the three required fields, resolving the project through a fixed
  precedence (a pasted Asana URL, an explicit GID, the repo registry, a workspace search, then
  asking), creating the task, and reporting back the new task's URL.

**Its place in the catalog.** It is the most-used skill in the set and the one that most needs a
*stated precedence*: a caller who pastes a URL, a caller in a repository with a registry, and a
caller who knows only a project's name all arrive at the same operation by different routes, and
without a fixed order an agent would pick differently each time.

Two of its instructions are corrections of mistakes an agent makes unprompted, which is why they are
written as prohibitions rather than steps: **the workspace GID never comes from the repo registry**
(it is deliberately not stored there), and **`list_view_gid` in a pasted URL is not a section** — it
is browser view metadata, so a URL containing `/list/` is not an instruction to call the Sections
API.

**What it adopts.** The catalog contract in [skills](../README.md).

**What decides its behavior lives elsewhere.** URL parsing is [url](../../url/README.md); the
registry lookup and the environment precedence are [config](../../config/README.md); creating the
task is [tasks](../../tasks/README.md); searching for the project is
[projects](../../projects/README.md). This skill is the composition, and none of those contracts is
re-frozen here. Whether an agent engages it and follows the precedence is ACED's measurement.
