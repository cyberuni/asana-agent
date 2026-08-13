---
'cyber-asana': minor
---

Add the `format-asana-description` skill for writing task and project
descriptions as rich text with `html_notes`.

Asana's rich text accepts only a narrow HTML subset, and the rejection is a bare
`XML is invalid` that names neither the tag nor the position. The skill documents
the subset as verified against the live API, converts markdown to it, and maps
each distinct error message back to its cause.

Notable corrections to what the tags are commonly assumed to be: `<h1>`–`<h3>`
and `<pre>` are supported; `<h4>`–`<h6>`, `<p>`, `<br>`, and `<div>` are not.
Paragraphs are separated by literal newlines. A bare `<body>` wrapper is
mandatory and may carry no attributes. A raw `<` or `>` is rejected even inside
`<code>` and `<pre>`, and `<code>` nested inside `<pre>` fails with an opaque
"unexpected error occurred".
