import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

const listCustomFieldsMock = vi.fn()
const getCustomFieldMock = vi.fn()

vi.mock('./api.js', async () => {
	const actual = await vi.importActual<typeof import('./api.js')>('./api.js')
	return {
		...actual,
		listCustomFields: listCustomFieldsMock,
		getCustomField: getCustomFieldMock,
	}
})

const { customFieldCommand } = await import('./cli.js')

describe('custom-fields/cli', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	it('custom-field list forwards workspace gid and pagination options', async () => {
		listCustomFieldsMock.mockResolvedValue({
			data: [{ gid: 'cf1', name: 'Priority', resource_subtype: 'enum' }],
			next_page: null,
			limit: 100,
		})
		const program = new Command().addCommand(customFieldCommand())

		await program.parseAsync(
			['node', 'test', 'custom-field', 'list', '--workspace-gid', 'ws1', '--limit', '50', '--opt-fields', 'gid,name'],
			{ from: 'node' },
		)

		expect(listCustomFieldsMock).toHaveBeenCalledWith('ws1', {
			limit: 50,
			optFields: 'gid,name',
		})
	})

	it('custom-field list applies a minimal default field set, a count summary, and next steps', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		listCustomFieldsMock.mockResolvedValue([{ gid: 'cf1', name: 'Priority', resource_subtype: 'enum' }])
		const program = new Command().addCommand(customFieldCommand())

		await program.parseAsync(['node', 'test', 'custom-field', 'list', '--workspace-gid', 'ws1'], { from: 'node' })

		expect(listCustomFieldsMock).toHaveBeenCalledWith(
			'ws1',
			expect.objectContaining({ optFields: 'gid,name,resource_subtype' }),
		)
		const lines = logSpy.mock.calls.map((c) => String(c[0]))
		expect(lines).toContain('\n1 custom field(s)')
		expect(lines.some((l) => l.includes('cyber-asana custom-field get <gid>'))).toBe(true)
		logSpy.mockRestore()
	})

	it('custom-field list names the entity when nothing comes back', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		listCustomFieldsMock.mockResolvedValue({ data: [], next_page: null, limit: 100 })
		const program = new Command().addCommand(customFieldCommand())

		await program.parseAsync(['node', 'test', 'custom-field', 'list', '--workspace-gid', 'ws1'], { from: 'node' })

		const lines = logSpy.mock.calls.map((c) => String(c[0]))
		expect(lines.some((l) => l.includes('0 custom fields found'))).toBe(true)
		logSpy.mockRestore()
	})

	it('custom-field get forwards gid and prints the enum options with their GIDs', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		getCustomFieldMock.mockResolvedValue({
			gid: 'cf1',
			name: 'Priority',
			resource_subtype: 'enum',
			enum_options: [
				{ gid: 'opt1', name: 'High', enabled: true },
				{ gid: 'opt2', name: 'Low', enabled: false },
			],
		})
		const program = new Command().addCommand(customFieldCommand())

		await program.parseAsync(['node', 'test', 'custom-field', 'get', 'cf1'], { from: 'node' })

		expect(getCustomFieldMock).toHaveBeenCalledWith('cf1')
		const logged = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
		expect(logged).toContain('Priority')
		expect(logged).toContain('enum')
		expect(logged).toContain('opt1')
		expect(logged).toContain('High')
		logSpy.mockRestore()
	})

	it('custom-field get names the entity when a field has no enum options', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		getCustomFieldMock.mockResolvedValue({ gid: 'cf2', name: 'Estimate', resource_subtype: 'number' })
		const program = new Command().addCommand(customFieldCommand())

		await program.parseAsync(['node', 'test', 'custom-field', 'get', 'cf2'], { from: 'node' })

		const logged = logSpy.mock.calls.map((c) => String(c[0])).join('\n')
		expect(logged).toContain('0 enum options found')
		logSpy.mockRestore()
	})

	it('custom-field command can use injected dependencies', async () => {
		const injectedGetCustomField = vi.fn().mockResolvedValue({ gid: 'cf1', name: 'Priority' })
		const program = new Command().addCommand(
			customFieldCommand({
				listCustomFields: vi.fn(),
				getCustomField: injectedGetCustomField,
			}),
		)

		await program.parseAsync(['node', 'test', 'custom-field', 'get', 'cf1'], { from: 'node' })

		expect(injectedGetCustomField).toHaveBeenCalledWith('cf1')
	})
})
