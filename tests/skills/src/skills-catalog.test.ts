import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = path.resolve(import.meta.dirname, '../../..')
const skillsRoot = path.join(repoRoot, 'packages/cyber-asana/skills')

const docsListingSkills = ['readme.md', 'apps/web/src/content/docs/skills/index.md']

async function skillNames() {
	const entries = await readdir(skillsRoot, { withFileTypes: true })
	return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)
}

async function frontmatter(name: string) {
	const content = await readFile(path.join(skillsRoot, name, 'SKILL.md'), 'utf8')
	const block = /^---\n([\s\S]*?)\n---/.exec(content)
	if (!block) throw new Error(`${name}: no frontmatter block`)
	const fields: Record<string, string> = {}
	for (const line of block[1].split('\n')) {
		const match = /^([a-z-]+):\s*(.*)$/.exec(line)
		if (match) fields[match[1]] = match[2]
	}
	return { fields, content }
}

describe('skill frontmatter', () => {
	it('declares a name matching the directory', async () => {
		for (const name of await skillNames()) {
			const { fields } = await frontmatter(name)
			expect(fields.name, `${name}: name must match its directory`).toBe(name)
		}
	})

	it('declares a description with trigger language', async () => {
		for (const name of await skillNames()) {
			const { fields } = await frontmatter(name)
			expect(fields.description, `${name}: missing description`).toBeTruthy()
			expect(
				/use this skill when|when to use/i.test(fields.description),
				`${name}: description needs "Use this skill when" trigger language`,
			).toBe(true)
		}
	})

	it('keeps descriptions within the 120-character budget', async () => {
		// Longer descriptions get truncated in the agent context window.
		for (const name of await skillNames()) {
			const { fields } = await frontmatter(name)
			expect(
				fields.description.length,
				`${name}: description is ${fields.description.length} chars`,
			).toBeLessThanOrEqual(120)
		}
	})
})

describe('skill references', () => {
	it('resolve to files inside the skill directory', async () => {
		for (const name of await skillNames()) {
			const { content } = await frontmatter(name)
			const referenced = [...content.matchAll(/`references\/([\w.-]+)`/g)].map((match) => match[1])
			for (const file of new Set(referenced)) {
				const target = path.join(skillsRoot, name, 'references', file)
				await expect(stat(target), `${name}: references/${file} does not exist`).resolves.toBeTruthy()
			}
		}
	})
})

describe.each(docsListingSkills)('%s', (relativePath) => {
	it('lists every shipped skill', async () => {
		const content = await readFile(path.join(repoRoot, relativePath), 'utf8')
		for (const name of await skillNames()) {
			expect(content, `${relativePath}: missing a table row for ${name}`).toContain(name)
		}
	})
})
