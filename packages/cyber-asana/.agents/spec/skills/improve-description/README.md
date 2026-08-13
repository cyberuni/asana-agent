---
spec-type: reference
concept: [cyber-asana, skills, rich-text, tasks]
---

# improve-description — the description copy-editing skill

A **reference artifact**: the shipped skill at `packages/cyber-asana/skills/improve-description/`,
which cleans up an Asana task or project description without rewriting it, and which is the recovery
path when Asana rejects rich text.

## Subject

- **Artifact** — `skills/improve-description/SKILL.md`, plus `references/templates.md` — the one
  skill in the catalog that ships a reference file, loaded only when the user opts into a template.
- **Trigger** — a description needs tidying or restructuring, or a write failed with
  `XML is invalid` / `Rich text should be wrapped in <body> tag`. Its front block reads:
  *"Use this skill when cleaning up an Asana task or project description, or when html_notes fails
  with "XML is invalid"."* It also declares an `argument-hint`, the only skill in the catalog that
  does.
- **What it covers** — reading the existing description as `html_notes` rather than the plain-text
  projection, a **light copy-edit by default** with an explicit do / do-not list, opt-in emoji,
  template and tone, and writing back inside Asana's accepted HTML subset.

**Its place in the catalog.** It is the only skill whose default behavior is stated as a
*restraint*: the instruction is to preserve the author's message, wording and structure and remove
only the noise. Left unstated, a capable model rewrites, and the user gets back a description that
is better prose and no longer theirs.

It is also the only skill backed by verified code: `src/skills/html-subset.ts` and its system test
probe which tags Asana actually accepts, so the subset the skill teaches is measured rather than
assumed.

**What it adopts.** The catalog contract in [skills](../README.md) — including the
reference-resolution rule, which this skill is the only current exerciser of.

**What decides its behavior lives elsewhere.** Reading and writing the description is
[tasks](../../tasks/README.md); `html_text` and its accepted subset are
[stories](../../stories/README.md)' vocabulary. Whether an agent's edit is genuinely a copy-edit and
not a rewrite is a **graded** judgment on generated prose — the clearest case in the catalog of a
question this corpus cannot settle by reading files, and the subject of the ACED suite tracked
separately.
