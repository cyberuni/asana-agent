import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

describe('stories/cli', () => {
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	it('story create truncates a long comment body by default and shows it all with --full', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const createStory = vi.fn().mockResolvedValue({ gid: 'story1', text: 'x'.repeat(600) })
		const deps = { listStories: vi.fn(), createStory, getTaskTemplateData: vi.fn() }

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
		logSpy.mockRestore()
	})

	it('story list applies a minimal default field set, a count summary, and next steps', async () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		const listStories = vi.fn().mockResolvedValue([{ gid: 'story1', type: 'comment', text: 'Hi' }])
		const program = new Command().addCommand(
			storyCommand('story', { listStories, createStory: vi.fn(), getTaskTemplateData: vi.fn() }),
		)

		await program.parseAsync(['node', 'test', 'story', 'list', '--task-gid', 'task1'], { from: 'node' })

		expect(listStories).toHaveBeenCalledWith(
			'task1',
			expect.objectContaining({ optFields: 'gid,type,text,created_at,created_by.name' }),
		)
		const lines = logSpy.mock.calls.map((c) => String(c[0]))
		expect(lines).toContain('\n1 story(s)')
		expect(lines.some((l) => l.includes('cyber-asana story create --task-gid task1'))).toBe(true)
		logSpy.mockRestore()
	})

	it('story list respects an explicit --opt-fields override', async () => {
		vi.spyOn(console, 'log').mockImplementation(() => {})
		const listStories = vi.fn().mockResolvedValue([])
		const program = new Command().addCommand(
			storyCommand('story', { listStories, createStory: vi.fn(), getTaskTemplateData: vi.fn() }),
		)

		await program.parseAsync(['node', 'test', 'story', 'list', '--task-gid', 'task1', '--opt-fields', 'gid,text'], {
			from: 'node',
		})

		expect(listStories).toHaveBeenCalledWith('task1', expect.objectContaining({ optFields: 'gid,text' }))
		vi.restoreAllMocks()
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

	it('story command can use injected dependencies', async () => {
		const injectedCreateStory = vi.fn().mockResolvedValue({ gid: 'story1', text: 'Comment' })
		const injectedLoadTask = vi.fn().mockResolvedValue({ name: 'Fix bug' })
		const program = new Command().addCommand(
			storyCommand('story', {
				listStories: vi.fn(),
				createStory: injectedCreateStory,
				getTaskTemplateData: injectedLoadTask,
			}),
		)

		await program.parseAsync(['node', 'test', 'story', 'create', 'Hi', '--task-gid', 'task1'], { from: 'node' })

		expect(injectedCreateStory).toHaveBeenCalledWith('task1', { text: 'Hi' })
		expect(injectedLoadTask).not.toHaveBeenCalled()
	})
})
