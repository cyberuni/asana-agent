import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createSectionMock = vi.fn()
const updateSectionMock = vi.fn()

vi.mock('./api.js', async () => {
	const actual = await vi.importActual<typeof import('./api.js')>('./api.js')
	return {
		...actual,
		createSection: createSectionMock,
		updateSection: updateSectionMock,
	}
})

const { sectionCommand } = await import('./cli.js')

describe('sections/cli', () => {
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	it('section list applies a minimal default field set, a count summary, and next steps', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const listSections = vi.fn().mockResolvedValue([{ gid: 'sec1', name: 'To Do' }])
		const program = new Command().addCommand(
			sectionCommand({
				listSections,
				getSection: vi.fn(),
				createSection: vi.fn(),
				updateSection: vi.fn(),
				deleteSection: vi.fn(),
			}),
		)

		await program.parseAsync(['node', 'test', 'section', 'list', '--project-gid', 'proj1'], { from: 'node' })

		expect(listSections).toHaveBeenCalledWith('proj1', expect.objectContaining({ optFields: 'gid,name' }))
		const lines = logSpy.mock.calls.map((c) => String(c[0]))
		expect(lines).toContain('\n1 section(s)')
		expect(lines.some((l) => l.includes('cyber-asana section get <gid>'))).toBe(true)
		logSpy.mockRestore()
	})

	it('section list respects an explicit --opt-fields override', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const listSections = vi.fn().mockResolvedValue([])
		const program = new Command().addCommand(
			sectionCommand({
				listSections,
				getSection: vi.fn(),
				createSection: vi.fn(),
				updateSection: vi.fn(),
				deleteSection: vi.fn(),
			}),
		)

		await program.parseAsync(['node', 'test', 'section', 'list', '--project-gid', 'proj1', '--opt-fields', 'name'], {
			from: 'node',
		})

		expect(listSections).toHaveBeenCalledWith('proj1', expect.objectContaining({ optFields: 'name' }))
		vi.restoreAllMocks()
	})

	it('section delete emits a structured acknowledgement with --json', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		process.argv = ['node', 'test', '--json']
		const program = new Command().option('--json').addCommand(
			sectionCommand({
				listSections: vi.fn(),
				getSection: vi.fn(),
				createSection: vi.fn(),
				updateSection: vi.fn(),
				deleteSection: vi.fn().mockResolvedValue(undefined),
			}),
		)

		await program.parseAsync(['node', 'test', '--json', 'section', 'delete', 'sec1'], { from: 'node' })

		expect(logSpy).toHaveBeenCalledWith(JSON.stringify({ deleted: true, resource: 'section', gid: 'sec1' }, null, 2))
		logSpy.mockRestore()
	})

	it('section create forwards project gid and name', async () => {
		createSectionMock.mockResolvedValue({ gid: 'sec1', name: 'In Progress' })
		const program = new Command().addCommand(sectionCommand())

		await program.parseAsync(['node', 'test', 'section', 'create', 'In Progress', '--project-gid', 'proj1'], {
			from: 'node',
		})

		expect(createSectionMock).toHaveBeenCalledWith('proj1', 'In Progress')
	})

	it('section update forwards gid and new name', async () => {
		updateSectionMock.mockResolvedValue({ gid: 'sec1', name: 'Done' })
		const program = new Command().addCommand(sectionCommand())

		await program.parseAsync(['node', 'test', 'section', 'update', 'sec1', '--name', 'Done'], { from: 'node' })

		expect(updateSectionMock).toHaveBeenCalledWith('sec1', 'Done')
	})

	it('section command can use injected dependencies', async () => {
		const injectedCreateSection = vi.fn().mockResolvedValue({ gid: 'sec1', name: 'In Progress' })
		const program = new Command().addCommand(
			sectionCommand({
				listSections: vi.fn(),
				getSection: vi.fn(),
				createSection: injectedCreateSection,
				updateSection: vi.fn(),
				deleteSection: vi.fn(),
			}),
		)

		await program.parseAsync(['node', 'test', 'section', 'create', 'In Progress', '--project-gid', 'proj1'], {
			from: 'node',
		})

		expect(injectedCreateSection).toHaveBeenCalledWith('proj1', 'In Progress')
	})
})
