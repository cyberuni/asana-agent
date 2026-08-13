---
cr: github-162
source: https://github.com/cyberuni/cyber-asana/issues/162
project-path: packages/cyber-asana
status: active
todos:
  - content: Decide the node shape for skills and record the rationale
    status: pending
  - content: Extend the root spec.md placement map with a skills route
    status: pending
  - content: Author the skills/ behavioral node (README + frozen suite)
    status: pending
  - content: Place all 9 shipped skills as reference nodes
    status: pending
  - content: Extract the catalog contract so the suite's negative edges are verifiable
    status: pending
  - content: Cover the packaging edges the catalog contract never checked
    status: pending
  - content: pnpm verify, commit per unit, open the PR closing #162
    status: pending
---

# github-162 — skills as a spec domain

Skills ship as consumer-facing surface (`packages/cyber-asana/skills/`, on the package `files`
allowlist, pointed at by every plugin manifest) with zero spec coverage. The corpus is
capability-first over `src/<domain>/`, and no placement-map route admits a skill.

## Node shape (decided)

**Hybrid.** One `skills/` **behavioral** node owning the cross-skill *catalog contract* — the
structural rules every shipped skill satisfies — plus one **reference** node per skill under
`skills/<name>/`.

Why not one node per skill with its own suite: a skill's own behavior is agent-configuration
behavior (does it engage, does it produce good output). That is ACED's lens, tracked separately in
issue #161. Freezing it here would claim a contract this corpus cannot verify.

Why not a single `skills/` node listing nine rows: "placed" has to mean each skill has a home that
names its subject and its boundary, or the corpus reads as covered where it is not.

## Ownership boundary with ACED

- This corpus: the **structural** contract — frontmatter, description budget, reference
  resolution, `npx` pinning, docs-table listing, packaging reach.
- ACED (#161): the **behavioral** evaluation — `@trigger` / `@behavior` / `@quality` over an agent
  running the skill.

## Owner question answered (relayed before acting)

`src/<domain>/` → `cli/<domain>/` was evaluated and **not** done: every domain folder carries
`gateway/api/cli/mcp`, so `cli/` names the parent after one of two consumers, and `src/skills/`
already exists so the sibling-surface goal needs no move. A neutral rename is a separate concern.

## NEXT

Author the `skills/` node and its frozen suite, then the nine reference nodes.
