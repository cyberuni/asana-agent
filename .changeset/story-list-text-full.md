---
"cyber-asana": patch
---

Fix `story list` ignoring `--full` on the `Text` column. The 60-character cut
now goes through the shared `truncate()` helper, so truncated text carries a
size hint and `--full` prints the whole comment — matching every other
free-text field in the package.
