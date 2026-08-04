import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

const listStatusesMock = vi.fn()
const createStatusMock = vi.fn()
const deleteStatusMock = vi.fn()

vi.mock('./api.js', async () => {
	const actual = await vi.importActual<typeof import('./api.js')>('./api.js')
	return {
		...actual,
		listStatuses: listStatusesMock,
		createStatus: createStatusMock,
		deleteStatus: deleteStatusMock,
	}
})

const { statusCommand } = await import('./cli.js')

describe('status/cli', () => {
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	it('status list applies a minimal default field set, a count summary, and next steps', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const listStatuses = vi.fn().mockResolvedValue([{ gid: 'st1', status_type: 'on_track' }])
		const program = new Command().addCommand(
			statusCommand({ listStatuses, getStatus: vi.fn(), createStatus: vi.fn(), deleteStatus: vi.fn() }),
		)

		await program.parseAsync(['node', 'test', 'status', 'list', '--parent-gid', 'proj1'], { from: 'node' })

		expect(listStatuses).toHaveBeenCalledWith(
			'proj1',
			expect.objectContaining({ optFields: 'gid,status_type,title,created_at' }),
		)
		const lines = logSpy.mock.calls.map((c) => String(c[0]))
		expect(lines).toContain('\n1 status update(s)')
		expect(lines.some((l) => l.includes('cyber-asana status get <gid>'))).toBe(true)
		logSpy.mockRestore()
	})

	it('status list respects an explicit --opt-fields override', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const listStatuses = vi.fn().mockResolvedValue([])
		const program = new Command().addCommand(
			statusCommand({ listStatuses, getStatus: vi.fn(), createStatus: vi.fn(), deleteStatus: vi.fn() }),
		)

		await program.parseAsync(['node', 'test', 'status', 'list', '--parent-gid', 'proj1', '--opt-fields', 'gid,text'], {
			from: 'node',
		})

		expect(listStatuses).toHaveBeenCalledWith('proj1', expect.objectContaining({ optFields: 'gid,text' }))
		vi.restoreAllMocks()
	})

	it('status delete emits a structured acknowledgement with --json', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		process.argv = ['node', 'test', '--json']
		const program = new Command().option('--json').addCommand(
			statusCommand({
				listStatuses: vi.fn(),
				getStatus: vi.fn(),
				createStatus: vi.fn(),
				deleteStatus: vi.fn().mockResolvedValue(undefined),
			}),
		)

		await program.parseAsync(['node', 'test', '--json', 'status', 'delete', 'st1'], { from: 'node' })

		expect(logSpy).toHaveBeenCalledWith(
			JSON.stringify({ deleted: true, resource: 'status_update', gid: 'st1' }, null, 2),
		)
		logSpy.mockRestore()
	})

	it('status list forwards parent gid and pagination options', async () => {
		listStatusesMock.mockResolvedValue({ data: [{ gid: 'st1', status_type: 'on_track' }], next_page: null, limit: 100 })
		const program = new Command().addCommand(statusCommand())

		await program.parseAsync(['node', 'test', 'status', 'list', '--parent-gid', 'proj1', '--limit', '25'], {
			from: 'node',
		})

		expect(listStatusesMock).toHaveBeenCalledWith('proj1', {
			limit: 25,
			optFields: 'gid,status_type,title,created_at',
		})
	})

	it('status create forwards parent gid, status type, and text', async () => {
		createStatusMock.mockResolvedValue({ gid: 'st1', status_type: 'on_track', text: 'All good' })
		const program = new Command().addCommand(statusCommand())

		await program.parseAsync(
			['node', 'test', 'status', 'create', '--parent-gid', 'proj1', '--status-type', 'on_track', '--text', 'All good'],
			{ from: 'node' },
		)

		expect(createStatusMock).toHaveBeenCalledWith('proj1', { status_type: 'on_track', text: 'All good' })
	})

	it('status delete forwards gid', async () => {
		deleteStatusMock.mockResolvedValue(undefined)
		const program = new Command().addCommand(statusCommand())

		await program.parseAsync(['node', 'test', 'status', 'delete', 'st1'], { from: 'node' })

		expect(deleteStatusMock).toHaveBeenCalledWith('st1')
	})

	it('status command can use injected dependencies', async () => {
		const injectedCreateStatus = vi.fn().mockResolvedValue({ gid: 'st1', status_type: 'on_track' })
		const program = new Command().addCommand(
			statusCommand({
				listStatuses: vi.fn(),
				getStatus: vi.fn(),
				createStatus: injectedCreateStatus,
				deleteStatus: vi.fn(),
			}),
		)

		await program.parseAsync(
			['node', 'test', 'status', 'create', '--parent-gid', 'proj1', '--status-type', 'on_track', '--text', 'Hi'],
			{ from: 'node' },
		)

		expect(injectedCreateStatus).toHaveBeenCalledWith('proj1', { status_type: 'on_track', text: 'Hi' })
	})
})
