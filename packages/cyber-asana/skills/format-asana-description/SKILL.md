---
name: format-asana-description
description: Use this skill when writing or rewriting an Asana task or project description as rich text — or when `html_notes` fails with "XML is invalid".
---

# Format Asana Description

## When to use

- Writing a task or project description with headings, lists, links, or code via `html_notes`.
- Converting markdown or plain text into Asana rich text.
- Recovering from `Asana API error: XML is invalid` (or `Rich text should be wrapped in <body> tag`).

Plain prose with no formatting needs no HTML — use `--notes` / `notes` instead.

## Instructions

### 1. Write the HTML

Wrap the whole document in a bare `<body>` — required, and it must carry no attributes.

CLI:

```sh
cyber-asana task update <gid> --html-notes '<body><h1>Summary</h1>Ship the thing.</body>'
```

MCP: pass `html_notes` to `asana_task_create` / `asana_task_update` (or `asana_project_update`). `--notes` and `--html-notes` are mutually exclusive; the same holds for `notes` and `html_notes`.

### 2. Use only supported tags

Verified against the live Asana API (`PUT /tasks/{gid}`, 2026-08).

**Supported**

| Tag | Notes |
| --- | --- |
| `<body>` | Required outermost wrapper, no attributes |
| `<h1>` `<h2>` `<h3>` | Headings — `<h4>`–`<h6>` are rejected |
| `<strong>` `<em>` `<u>` `<s>` | `<b>` → `<strong>`, `<i>` → `<em>` on save |
| `<code>` | Inline code |
| `<pre>` | Code block; `data-language` attribute is kept |
| `<ul>` `<ol>` `<li>` | Nesting allowed, including `<ol>` inside `<ul>` |
| `<a href="...">` | `href` (or `data-asana-gid`) required; absolute URL only |
| `<blockquote>` | Multi-line allowed |
| `<table>` `<tr>` `<td>` | `<th>` is rejected — use `<td>` for the header row |
| `<hr>` | Normalized to `<hr />` |
| `<mark>` | Highlight; Asana injects its own color attributes |

**Rejected — these are what produce `XML is invalid`**

`<p>` · `<br>` · `<div>` · `<h4>`–`<h6>` · `<img>` · `<del>` · `<sub>` · `<sup>` · `<th>` · `<li>` outside a list

`<span>` is accepted but silently stripped to its text.

`<pre><code>` nested together fails with an opaque *"unexpected error occurred"* — use `<pre>` alone.

### 3. Line breaks are literal newlines

There is no `<p>` and no `<br>`. Separate blocks with real newline characters inside `<body>`; Asana preserves them.

```html
<body><h1>Summary</h1>
First paragraph.

Second paragraph.</body>
```

Passing `html_notes` via MCP avoids shell quoting entirely and is the safer path for multi-line content. From a POSIX shell, use a quoted heredoc so the newlines survive:

```sh
cyber-asana task update <gid> --html-notes "$(cat <<'HTML'
<body><h1>Summary</h1>
Ship the thing.
</body>
HTML
)"
```

### 4. Escape `<`, `>` in text

A raw `<` or `>` outside a tag is rejected with `Malformed rich text. Found < or > that was not part of tag.` Escape them as `&lt;` / `&gt;` everywhere — including inside `<code>` and `<pre>`, which do **not** suppress parsing.

```html
<body><pre>&lt;h2&gt;Title&lt;/h2&gt;</pre></body>
```

`&` may be written raw; Asana normalizes it to `&amp;`, in text and in `href` alike. Every tag must be closed — an unclosed `<strong>` is rejected.

## Markdown → Asana HTML

| Markdown | Asana |
| --- | --- |
| `# H1` / `## H2` / `### H3` | `<h1>` / `<h2>` / `<h3>` |
| `#### H4` and deeper | Flatten to `<h3>`, or `<strong>` on its own line |
| Paragraph break | Blank line (literal newline), never `<p>` |
| `**bold**` / `*italic*` | `<strong>` / `<em>` |
| `` `code` `` | `<code>` |
| ```` ```ts ... ``` ```` | `<pre data-language="typescript">…</pre>`, contents escaped |
| `- item` / `1. item` | `<ul><li>…</li></ul>` / `<ol><li>…</li></ol>` |
| `[text](url)` | `<a href="url">text</a>` — absolute URL only |
| `> quote` | `<blockquote>` |
| `---` | `<hr />` |
| `- [ ] todo` | `<ul><li>☐ todo</li></ul>` — checklist markup is stripped |

## Patterns

**PRD**

```html
<body><h1>Summary</h1>
One paragraph on what and why.

<h2>Goals</h2>
<ul><li>Goal one</li><li>Goal two</li></ul>

<h2>Non-goals</h2>
<ul><li>Explicitly out of scope</li></ul>

<h2>Acceptance criteria</h2>
<ol><li>Observable outcome</li><li>Observable outcome</li></ol>
</body>
```

**Research note**

```html
<body><h1>Question</h1>
What are we trying to learn?

<h2>Findings</h2>
<ul><li><strong>Finding</strong> — evidence, with a <a href="https://example.com/source">source</a></li></ul>

<h2>Open questions</h2>
<ul><li>Still unknown</li></ul>
</body>
```

**Bug report**

```html
<body><h1>Symptom</h1>
What the user sees.

<h2>Repro</h2>
<ol><li>Step</li><li>Step</li></ol>

<h2>Expected vs actual</h2>
<ul><li><strong>Expected</strong> — …</li><li><strong>Actual</strong> — …</li></ul>

<h2>Evidence</h2>
<pre>Error: value &lt; 0 not allowed
  at validate (input.ts:42)</pre>
</body>
```

Leave a section out rather than filling it with a placeholder; an empty heading reads as an unanswered question.

## Verify

Read the task back to see exactly what Asana stored — normalization (`<b>`→`<strong>`, dropped `<span>`, stripped list attributes) happens on save. `task get` returns both `html_notes` and the plain-text `notes` projection:

```sh
cyber-asana task get <gid> --json
```

## Troubleshooting

| Error | Cause |
| --- | --- |
| `Rich text should be wrapped in <body> tag.` | Missing `<body>`, or `<body>` carries an attribute |
| `XML is invalid` | An unsupported tag — check `<p>`, `<br>`, `<div>`, `<h4>`+, `<img>` |
| `XML is invalid: Malformed rich text. Found < or > that was not part of tag.` | Unescaped `<` or `>` in text |
| `XML is invalid: Malformed rich text. XML tag was not closed.` | Unclosed tag |
| `One of data-asana-gid or href is required in anchor attributes` | `<a>` with no `href` |
| `invalid protocol in HREF field` | Relative or non-http(s) `href` |
| `Oops! An unexpected error occurred…` | `<code>` nested inside `<pre>` |
