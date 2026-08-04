---
"cyber-asana": patch
---

Fix `task create` sending followers twice. The followers already ride the
`POST /tasks` create body, so the extra `addFollowers` request was redundant —
it is gone. Creating a task with followers now makes exactly one round trip and
returns the create response instead of the follower-addition response.
