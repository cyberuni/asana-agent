---
'cyber-asana': minor
---

Close cross-surface gaps in the stories, attachments, and tags domains — fields Asana accepts on
endpoints this package already wraps, but that reached neither the CLI nor the MCP tool.

- `story create` / `story update` (and the `comment` aliases) gain `--pin`, `--unpin`, and
  `--sticker <name>`; `asana_story_create` / `asana_story_update` gain `is_pinned` and
  `sticker_name`. Pinning or stickering is an edit in its own right, so `update` no longer needs a
  replacement body. `--pin` with `--unpin`, and a sticker outside Asana's twelve, are usage errors
  caught before any request is sent.
- `tag create` gains `--follower <gid[,gid...]>` and `asana_tag_create` gains `follower_gids`.
  Asana takes `followers` only at creation, so `update` deliberately has no counterpart.
- `tag update` gains `--clear-color` (`clear_color` over MCP) for Asana's nullable tag colour,
  mirroring `task update --clear-due-on`.
- `asana_attachment_create` gains `connect_to_app`, and `attachment create` gains
  `--connect-to-app`. Asana honours it only on an external `--url` attachment, so pairing it with a
  file upload is a local usage error.
- `asana_tag_delete` is now idempotent, like the CLI and every other delete in the package. Its
  response body changes from `{ ok: true, deleted: "<gid>" }` to the shared
  `{ deleted, resource, gid, already_absent }` record.
