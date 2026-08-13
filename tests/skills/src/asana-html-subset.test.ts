import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const skillPath = path.join(repoRoot, 'packages/cyber-asana/skills/format-asana-description/SKILL.md')

// Verified against the live Asana API (PUT /tasks/{gid}), 2026-08. Issue #159 reported
// several of these backwards, so the skill's claims are pinned here rather than trusted.
const SUPPORTED = [
	'<body>',
	'<h1>',
	'<h2>',
	'<h3>',
	'<strong>',
	'<em>',
	'<u>',
	'<s>',
	'<code>',
	'<pre>',
	'<ul>',
	'<ol>',
	'<li>',
	'<blockquote>',
	'<hr>',
	'<mark>',
]
const REJECTED = ['<p>', '<br>', '<div>', '<h4>', '<h5>', '<h6>', '<img>', '<del>', '<sub>', '<sup>', '<th>']

// `<li>` is deliberately on both sides: supported inside a list, rejected outside one.
const QUALIFIED = ['<li>']

// The skill writes contiguous headings as a range (`<h4>`-`<h6>`); expand before matching.
function expandRanges(section: string) {
	return section.replace(/`<h(\d)>`[–-]`<h(\d)>`/g, (_, from: string, to: string) => {
		const tags = []
		for (let level = Number(from); level <= Number(to); level++) tags.push(`\`<h${level}>\``)
		return tags.join(' · ')
	})
}

let supportedSection = ''
let rejectedTags = new Set<string>()

beforeAll(async () => {
	const content = await readFile(skillPath, 'utf8')
	const supportedStart = content.indexOf('**Supported**')
	const rejectedStart = content.indexOf('**Rejected')
	expect(supportedStart, 'skill is missing its **Supported** tag table').toBeGreaterThan(-1)
	expect(rejectedStart, 'skill is missing its **Rejected** tag list').toBeGreaterThan(supportedStart)

	supportedSection = expandRanges(content.slice(supportedStart, rejectedStart))

	// Only the `·`-separated line enumerates rejected tags; the prose after it mentions
	// supported tags too (`<span>`, `<pre><code>`) and must not be read as a tag list.
	const rejectedLine = content
		.slice(rejectedStart)
		.split('\n')
		.find((line) => line.includes('·'))
	expect(rejectedLine, 'skill no longer enumerates rejected tags on one line').toBeTruthy()
	rejectedTags = new Set([...expandRanges(rejectedLine as string).matchAll(/`(<[a-z0-9]+>)`/g)].map((m) => m[1]))
})

describe('supported tags', () => {
	it.each(SUPPORTED)('%s is documented as supported', (tag) => {
		expect(supportedSection).toContain(tag)
	})

	it.each(SUPPORTED.filter((tag) => !QUALIFIED.includes(tag)))('%s is not also listed as rejected', (tag) => {
		expect([...rejectedTags]).not.toContain(tag)
	})
})

describe('rejected tags', () => {
	it.each(REJECTED)('%s is documented as rejected', (tag) => {
		expect([...rejectedTags]).toContain(tag)
	})
})

describe('headings', () => {
	// Issue #159 claimed <h2>/<h3> were unsupported and that emoji headers were the
	// workaround. They are supported; <h4>-<h6> are the ones the API rejects.
	it('treats h1-h3 as supported and h4-h6 as rejected', () => {
		for (const tag of ['<h1>', '<h2>', '<h3>']) {
			expect(supportedSection).toContain(tag)
			expect([...rejectedTags]).not.toContain(tag)
		}
		for (const tag of ['<h4>', '<h5>', '<h6>']) expect([...rejectedTags]).toContain(tag)
	})
})

describe('pitfalls that do not surface as "XML is invalid"', () => {
	it('documents each distinct API error string', async () => {
		const content = await readFile(skillPath, 'utf8')
		const errors = [
			'Rich text should be wrapped in <body> tag.',
			'Found < or > that was not part of tag.',
			'XML tag was not closed.',
			'One of data-asana-gid or href is required in anchor attributes',
			'invalid protocol in HREF field',
		]
		for (const message of errors) {
			expect(content, `skill no longer explains: ${message}`).toContain(message)
		}
	})

	it('warns that <pre><code> nested together fails', async () => {
		const content = await readFile(skillPath, 'utf8')
		expect(content).toContain('<pre><code>')
	})

	it('requires escaping < and > inside code and pre', async () => {
		const content = await readFile(skillPath, 'utf8')
		expect(content).toMatch(/&lt;/)
		expect(content).toMatch(/do \*\*not\*\* suppress parsing/)
	})
})

describe('default behavior', () => {
	// Per the follow-up on #159: the default pass must stay a light copy-edit.
	it('states that the default is a copy-edit, not a rewrite', async () => {
		const content = await readFile(skillPath, 'utf8')
		expect(content).toMatch(/default is a copy-edit, not a rewrite/i)
	})

	it('lists emoji and tone rewriting as things not done by default', async () => {
		const content = await readFile(skillPath, 'utf8')
		const doNot = content.slice(content.indexOf('Do **not**, unless asked:'), content.indexOf('### 3.'))
		expect(doNot).toMatch(/Add emoji/i)
		expect(doNot).toMatch(/Rewrite for tone/i)
		expect(doNot).toMatch(/Add, remove, or reorder sections/i)
	})
})

describe('reading the description', () => {
	it('directs the agent to html_notes and away from the notes projection', async () => {
		const content = await readFile(skillPath, 'utf8')
		expect(content).toMatch(/Always edit from `html_notes`/)
		expect(content).toMatch(/no case where you need the plain-text `notes` projection/)
	})
})
