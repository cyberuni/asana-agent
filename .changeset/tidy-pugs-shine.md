---
'cyber-asana': minor
---

Add the `improve-description` skill for cleaning up and rewriting task and
project descriptions.

The default pass is a copy-edit, not a rewrite: collapse runs of blank lines, fix
typos and broken markup, turn dash lists into real lists — while preserving the
author's message, wording, and section structure. Emoji, templates, tone changes,
and research-backed citations are opt-in modifiers the user asks for, never
applied by default.

The skill also documents Asana's rich-text HTML subset, verified against the live
API, because the rejection is a bare `XML is invalid` that names neither the tag
nor the position. Notable corrections to what the tags are commonly assumed to
be: `<h1>`–`<h3>` and `<pre>` are supported; `<h4>`–`<h6>`, `<p>`, `<br>`, and
`<div>` are not. Paragraphs are separated by literal newlines. A bare `<body>`
wrapper is mandatory and may carry no attributes. A raw `<` or `>` is rejected
even inside `<code>` and `<pre>`, and `<code>` nested inside `<pre>` fails with
an opaque "unexpected error occurred".
