---
spec-type: reference
concept: [cyber-asana, skills, project-export, offline]
---

# sync-asana-project — the local-snapshot skill

A **reference artifact**: the shipped skill at `packages/cyber-asana/skills/sync-asana-project/`,
which pulls an Asana project's tasks into a markdown file in the repository.

## Subject

- **Artifact** — `skills/sync-asana-project/SKILL.md`. No references directory.
- **Trigger** — the user wants a local copy of a project's tasks, for planning, for attaching
  context to a codebase, or for working offline. Its front block reads: *"Use this skill when
  pulling Asana project tasks into local markdown for offline planning or documentation."*
- **What it covers** — identifying the project (by name fragment, or by listing active projects and
  asking), exporting it with `project export`, previewing on stdout when no output path is given,
  and telling the user the path that was written.

**Its place in the catalog.** It is the shortest skill in the set, and the only one that **writes a
file into the user's repository**. Hence the two instructions that look like manners and are not:
preview before writing when no path was named, and always report the path afterwards. A file written
where the user did not expect it is the one outcome here that is hard to notice and annoying to
undo.

**What it adopts.** The catalog contract in [skills](../README.md).

**What decides its behavior lives elsewhere.** The project search and the markdown export are
[projects](../../projects/README.md); the output-format advice is [axi](../../axi/README.md).
Whether the agent picks the project the user meant is a graded judgment — ACED's.
