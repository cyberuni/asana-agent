import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { StoryApi } from './api.js'

const createStoryMock = vi.fn()
const getTaskTemplateDataMock = vi.fn()

vi.mock('./api.js', async () => {
	const actual = await vi.importActual<typeof import('./api.js')>('./api.js')
	return {
		...actual,
		createStory: createStoryMock,
		getTaskTemplateData: getTaskTemplateDataMock,
	}
})

const { storyCommand } = await import('./cli.js')

function storyDeps(overrides: Partial<StoryApi> = {}): StoryApi {
	return {
		listStories: vi.fn(),
		createStory: vi.fn(),
		getStory: vi.fn(),
		updateStory: vi.fn(),
		deleteStory: vi.fn(),
		getTaskTemplateData: vi.fn(),
		...overrides,
	}
}

describe('stories/cli', () => {
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	it('story create truncates a long comment body by default and shows it all with --full', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const createStory = vi.fn().mockResolvedValue({ gid: 'story1', text: 'x'.repeat(600) })
		const deps = storyDeps({ createStory })

		await new Command()
			.addCommand(storyCommand('story', deps))
			.parseAsync(['node', 'test', 'story', 'create', 'hi', '--task-gid', 'task1'], { from: 'node' })
		expect(logSpy.mock.calls.map((c) => String(c[0])).find((l) => l.startsWith('Text'))).toContain(
			'[truncated, 600 chars total; use --full for the rest]',
		)

		logSpy.mockClear()
		process.argv = ['node', 'test', '--full']
		await new Command()
			.option('--full')
			.addCommand(storyCommand('story', deps))
			.parseAsync(['node', 'test', '--full', 'story', 'create', 'hi', '--task-gid', 'task1'], { from: 'node' })
		expect(logSpy.mock.calls.map((c) => String(c[0])).find((l) => l.startsWith('Text'))).not.toContain('[truncated')
	})

	it('story list applies a minimal default field set, a count summary, and next steps', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const listStories = vi.fn().mockResolvedValue([{ gid: 'story1', type: 'comment', text: 'Hi' }])
		const program = new Command().addCommand(storyCommand('story', storyDeps({ listStories })))

		await program.parseAsync(['node', 'test', 'story', 'list', '--task-gid', 'task1'], { from: 'node' })

		expect(listStories).toHaveBeenCalledWith(
			'task1',
			expect.objectContaining({ optFields: 'gid,type,text,created_at,created_by.name' }),
		)
		const lines = logSpy.mock.calls.map((c) => String(c[0]))
		expect(lines).toContain('\n1 story(s)')
		expect(lines.some((l) => l.includes('cyber-asana story create --task-gid task1'))).toBe(true)
		expect(lines.some((l) => l.includes('cyber-asana story update <gid>'))).toBe(true)
		expect(lines.some((l) => l.includes('cyber-asana story delete <gid>'))).toBe(true)
	})

	it('story list respects an explicit --opt-fields override', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const listStories = vi.fn().mockResolvedValue([])
		const program = new Command().addCommand(storyCommand('story', storyDeps({ listStories })))

		await program.parseAsync(['node', 'test', 'story', 'list', '--task-gid', 'task1', '--opt-fields', 'gid,text'], {
			from: 'node',
		})

		expect(listStories).toHaveBeenCalledWith('task1', expect.objectContaining({ optFields: 'gid,text' }))
	})

	describe('story list Text column', () => {
		const longText = `${'g'.repeat(60)}-overflow`
		const originalArgv = [...process.argv]
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

		afterEach(() => {
			process.argv = [...originalArgv]
		})

		function listProgram() {
			return new Command().option('--full').addCommand(
				storyCommand(
					'story',
					storyDeps({
						listStories: vi.fn().mockResolvedValue({ data: [{ gid: '5501', type: 'comment', text: longText }] }),
					}),
				),
			)
		}

		it('truncates a long story text with a size hint by default', async () => {
			await listProgram().parseAsync(['node', 'test', 'story', 'list', '--task-gid', 'task1'], { from: 'node' })

			const row = logSpy.mock.calls.map((c) => String(c[0])).find((line) => line.includes('5501'))
			expect(row).toContain('g'.repeat(60))
			expect(row).not.toContain('-overflow')
			expect(row).toContain(`[truncated, ${longText.length} chars total; use --full for the rest]`)
		})

		it('shows the full story text with --full', async () => {
			process.argv = ['node', 'test', '--full']

			await listProgram().parseAsync(['node', 'test', '--full', 'story', 'list', '--task-gid', 'task1'], {
				from: 'node',
			})

			const row = logSpy.mock.calls.map((c) => String(c[0])).find((line) => line.includes('5501'))
			expect(row).toContain(longText)
			expect(row).not.toContain('[truncated')
		})
	})

	it('story create forwards html_text', async () => {
		createStoryMock.mockResolvedValue({ gid: 'story1', text: 'Rich' })
		const program = new Command().addCommand(storyCommand())

		await program.parseAsync(
			['node', 'test', 'story', 'create', '--task-gid', 'task1', '--html-text', '<body><strong>Rich</strong></body>'],
			{ from: 'node' },
		)

		expect(createStoryMock).toHaveBeenCalledWith('task1', {
			html_text: '<body><strong>Rich</strong></body>',
		})
	})

	it('story create applies templates to html_text', async () => {
		getTaskTemplateDataMock.mockResolvedValue({
			name: 'Fix bug',
			assignee: { name: 'Alice' },
			due_on: '2026-06-01',
			notes: 'Ship it',
		})
		createStoryMock.mockResolvedValue({ gid: 'story1', text: 'Rich' })
		const program = new Command().addCommand(storyCommand())

		await program.parseAsync(
			[
				'node',
				'test',
				'story',
				'create',
				'--task-gid',
				'task1',
				'--html-text',
				'<body><strong>{task.name}</strong> for {task.assignee}</body>',
				'--template',
			],
			{ from: 'node' },
		)

		expect(createStoryMock).toHaveBeenCalledWith('task1', {
			html_text: '<body><strong>Fix bug</strong> for Alice</body>',
		})
	})

	it('story get prints the story fields', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const getStory = vi.fn().mockResolvedValue({ gid: 'story1', type: 'comment', text: 'Hi' })
		const program = new Command().addCommand(storyCommand('story', storyDeps({ getStory })))

		await program.parseAsync(['node', 'test', 'story', 'get', 'story1'], { from: 'node' })

		expect(getStory).toHaveBeenCalledWith('story1')
		expect(logSpy.mock.calls.map((c) => String(c[0])).some((l) => l.includes('story1'))).toBe(true)
	})

	it('story update replaces the comment text', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const updateStory = vi.fn().mockResolvedValue({ gid: 'story1', text: 'Corrected' })
		const program = new Command().addCommand(storyCommand('story', storyDeps({ updateStory })))

		await program.parseAsync(['node', 'test', 'story', 'update', 'story1', 'Corrected'], { from: 'node' })

		expect(updateStory).toHaveBeenCalledWith('story1', { text: 'Corrected' })
	})

	it('story update forwards html_text', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const updateStory = vi.fn().mockResolvedValue({ gid: 'story1', text: 'Corrected' })
		const program = new Command().addCommand(storyCommand('story', storyDeps({ updateStory })))

		await program.parseAsync(
			['node', 'test', 'story', 'update', 'story1', '--html-text', '<body><strong>Corrected</strong></body>'],
			{ from: 'node' },
		)

		expect(updateStory).toHaveBeenCalledWith('story1', { html_text: '<body><strong>Corrected</strong></body>' })
	})

	it('comment delete removes the comment', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const deleteStory = vi.fn().mockResolvedValue(undefined)
		const program = new Command().addCommand(storyCommand('comment', storyDeps({ deleteStory })))

		await program.parseAsync(['node', 'test', 'comment', 'delete', 'story1'], { from: 'node' })

		expect(deleteStory).toHaveBeenCalledWith('story1')
		expect(logSpy.mock.calls.map((c) => String(c[0]))).toContain('Deleted comment story1')
	})

	it('story delete succeeds when the comment is already gone', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const deleteStory = vi.fn().mockRejectedValue({
			response: { status: 404, body: { errors: [{ message: 'Not Found' }] } },
		})
		const program = new Command().addCommand(storyCommand('story', storyDeps({ deleteStory })))

		await program.parseAsync(['node', 'test', 'story', 'delete', 'story1'], { from: 'node' })

		expect(logSpy.mock.calls.map((c) => String(c[0]))).toContain('Comment story1 was already deleted')
	})

	it('story command can use injected dependencies', async () => {
		const injectedCreateStory = vi.fn().mockResolvedValue({ gid: 'story1', text: 'Comment' })
		const injectedLoadTask = vi.fn().mockResolvedValue({ name: 'Fix bug' })
		const program = new Command().addCommand(
			storyCommand('story', storyDeps({ createStory: injectedCreateStory, getTaskTemplateData: injectedLoadTask })),
		)

		await program.parseAsync(['node', 'test', 'story', 'create', 'Hi', '--task-gid', 'task1'], { from: 'node' })

		expect(injectedCreateStory).toHaveBeenCalledWith('task1', { text: 'Hi' })
		expect(injectedLoadTask).not.toHaveBeenCalled()
	})
})
