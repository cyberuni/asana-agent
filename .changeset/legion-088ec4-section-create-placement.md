---
'cyber-asana': minor
---

`section create` and `asana_section_create` accept a placement

Asana's create-section endpoint has always taken `insert_before` / `insert_after`, but
cyber-asana only sent the name — a new column had to be created and then moved. Both
surfaces now expose the same placement flags `section move` already had:

```sh
cyber-asana section create "In Review" --project-gid <gid> --insert-after <section-gid>
```

Naming both placements is a usage error, caught before any request is sent.
