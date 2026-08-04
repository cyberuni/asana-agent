---
"cyber-asana": patch
---

Fix `story create --html-text` reporting a locally-rejected payload as
`Asana rejected html_text: ...`. The local shape check now runs outside the
try/catch that wraps the Asana call, so a payload that never left the machine
keeps its local error message instead of being attributed to Asana.
