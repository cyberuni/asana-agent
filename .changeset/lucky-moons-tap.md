---
'cyber-asana': patch
---

Catch `npx -y cyber-asana` as an unpinned invocation. The catalog contract's pinning rule skipped over `--yes` but not its `-y` abbreviation, so the shorter spelling passed unchecked in every skill and reference file.
