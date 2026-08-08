---
"cyber-asana": minor
---

Add `rule trigger` and the `asana_rule_trigger` MCP tool, firing an Asana automation rule that uses an "incoming web request" trigger. Takes `--resource` (the task GID) and `--action-data-json` (free-form variables the rule's action reads). Asana's `402` now surfaces as a plan limitation with exit code `7` instead of a generic failure.
