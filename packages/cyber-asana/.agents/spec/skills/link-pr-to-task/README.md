---
spec-type: reference
concept: [cyber-asana, skills, comments, task-association]
---

# link-pr-to-task — the PR-to-task linking skill

A **reference artifact**: the shipped skill at `packages/cyber-asana/skills/link-pr-to-task/`, which
records a GitHub pull request on the Asana task it implements.

## Subject

- **Artifact** — `skills/link-pr-to-task/SKILL.md`. No references directory.
- **Trigger** — a PR was opened or merged and should be recorded on its task, or the user says
  "link this PR to Asana". Its front block reads: *"Use this skill when posting a GitHub PR URL as a
  comment on an Asana task to link code back to the work item."*
- **What it covers** — obtaining the PR URL (from the user, or from the current branch via `gh`),
  **inferring the task** through a fixed order (a GID or URL the user mentioned, then the branch
  name, then the PR title or body), falling back to a keyword search with the user confirming the
  match, and posting the URL as a comment.

**Its place in the catalog.** It is the only skill that reaches outside Asana for its input, and the
only one whose subject must be *inferred* rather than supplied. That is why its inference order is
written down and why the search fallback ends in a confirmation rather than a guess: a comment
posted on the wrong task is visible to the whole team and is not silently corrected.

**What it adopts.** The catalog contract in [skills](../README.md).

**What decides its behavior lives elsewhere.** Posting the comment is
[stories](../../stories/README.md); the search is [tasks](../../tasks/README.md); parsing a pasted
Asana URL is [url](../../url/README.md). Whether the inference picks the right task from an ambiguous
branch name is a graded judgment — ACED's.
