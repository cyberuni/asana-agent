import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'

const createTaskMock = vi.fn()
const updateTaskMock = vi.fn()
const addFollowersToTaskMock = vi.fn()
const removeFollowersFromTaskMock = vi.fn()
const getTasksByGidMock = vi.fn()
const getTaskMock = vi.fn()
const listTasksMock = vi.fn()
const getMyTasksMock = vi.fn()
const listSubtasksMock = vi.fn()

vi.mock('./api.js', async () => {
	const actual = await vi.importActual<typeof import('./api.js')>('./api.js')
	return {
		...actual,
		createTask: createTaskMock,
		updateTask: updateTaskMock,
		addFollowersToTask: addFollowersToTaskMock,
		removeFollowersFromTask: removeFollowersFromTaskMock,
		getTasksByGid: getTasksByGidMock,
		getTask: getTaskMock,
		listTasks: listTasksMock,
		getMyTasks: getMyTasksMock,
		listSubtasks: listSubtasksMock,
	}
})

const { taskCommand } = await import('./cli.js')

describe('tasks/cli', () => {
	const originalArgv = [...process.argv]
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	// Mutation acknowledgements must honor --json/--toon like every other command.
	describe.each([
		{
			name: 'task delete',
			argv: ['task', 'delete', 't1'],
			method: 'deleteTask',
			payload: { deleted: true, resource: 'task', gid: 't1', already_absent: false },
		},
		{
			name: 'task project add',
			argv: ['task', 'project', 'add', 't1', 'p1'],
			method: 'addTaskToProject',
			payload: { task: 't1', project: 'p1', status: 'added' },
		},
		{
			name: 'task project remove',
			argv: ['task', 'project', 'remove', 't1', 'p1'],
			method: 'removeTaskFromProject',
			payload: { task: 't1', project: 'p1', status: 'removed' },
		},
		{
			name: 'task follower add',
			argv: ['task', 'follower', 'add', 't1', 'u1', 'u2'],
			method: 'addFollowersToTask',
			payload: { task: 't1', followers: ['u1', 'u2'], status: 'added' },
		},
		{
			name: 'task follower remove',
			argv: ['task', 'follower', 'remove', 't1', 'u1'],
			method: 'removeFollowersFromTask',
			payload: { task: 't1', followers: ['u1'], status: 'removed' },
		},
		{
			name: 'task dependency add',
			argv: ['task', 'dependency', 'add', 't1', 'd1'],
			method: 'addDependencies',
			payload: { task: 't1', dependencies: ['d1'], status: 'added' },
		},
		{
			name: 'task dependency remove',
			argv: ['task', 'dependency', 'remove', 't1', 'd1'],
			method: 'removeDependencies',
			payload: { task: 't1', dependencies: ['d1'], status: 'removed' },
		},
		{
			name: 'task dependent add',
			argv: ['task', 'dependent', 'add', 't1', 'd1'],
			method: 'addDependents',
			payload: { task: 't1', dependents: ['d1'], status: 'added' },
		},
		{
			name: 'task dependent remove',
			argv: ['task', 'dependent', 'remove', 't1', 'd1'],
			method: 'removeDependents',
			payload: { task: 't1', dependents: ['d1'], status: 'removed' },
		},
	])('$name', ({ argv, method, payload }) => {
		it('emits a structured acknowledgement with --json', async () => {
			process.argv = ['node', 'test', '--json']
			const api = { [method]: vi.fn().mockResolvedValue(undefined) } as never
			const program = new Command().option('--json').addCommand(taskCommand(api))

			await program.parseAsync(['node', 'test', '--json', ...argv], { from: 'node' })

			expect(logSpy).toHaveBeenCalledWith(JSON.stringify(payload, null, 2))
		})
	})

	it('task create normalizes multi-project, followers, html notes, and custom fields', async () => {
		createTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			[
				'node',
				'test',
				'task',
				'create',
				'Task',
				'--workspace-gid',
				'ws1',
				'--project',
				'p1,p2',
				'--follower',
				'u1,u2',
				'--html-notes',
				'<body>Hi</body>',
				'--parent',
				'parent1',
				'--resource-subtype',
				'milestone',
				'--custom-fields-json',
				'{"cf1":"json"}',
				'--custom-field',
				'cf2=value',
			],
			{ from: 'node' },
		)

		expect(createTaskMock).toHaveBeenCalledWith('ws1', 'Task', {
			html_notes: '<body>Hi</body>',
			projects: ['p1', 'p2'],
			followers: ['u1', 'u2'],
			parent: 'parent1',
			resource_subtype: 'milestone',
			custom_fields: { cf1: 'json', cf2: 'value' },
		})
	})

	it('task update normalizes html notes, parent, and custom fields', async () => {
		updateTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			[
				'node',
				'test',
				'task',
				'update',
				'123',
				'--html-notes',
				'<body>Updated</body>',
				'--parent',
				'parent1',
				'--resource-subtype',
				'milestone',
				'--custom-field',
				'cf2=value',
			],
			{ from: 'node' },
		)

		expect(updateTaskMock).toHaveBeenCalledWith('123', {
			html_notes: '<body>Updated</body>',
			parent: 'parent1',
			resource_subtype: 'milestone',
			custom_fields: { cf2: 'value' },
		})
	})

	it('task update maps clear due flag to due_on null', async () => {
		updateTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'update', '123', '--clear-due-on'], { from: 'node' })

		expect(updateTaskMock).toHaveBeenCalledWith('123', {
			due_on: null,
		})
	})

	it('task create sets start_on alongside due_on', async () => {
		createTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			[
				'node',
				'test',
				'task',
				'create',
				'Task',
				'--workspace-gid',
				'ws1',
				'--start-on',
				'2026-09-01',
				'--due-on',
				'2026-10-31',
			],
			{ from: 'node' },
		)

		expect(createTaskMock).toHaveBeenCalledWith('ws1', 'Task', {
			start_on: '2026-09-01',
			due_on: '2026-10-31',
		})
	})

	it('task create sets due_at and start_at', async () => {
		createTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			[
				'node',
				'test',
				'task',
				'create',
				'Task',
				'--workspace-gid',
				'ws1',
				'--start-at',
				'2026-09-01T09:00:00.000Z',
				'--due-at',
				'2026-10-31T17:00:00.000Z',
			],
			{ from: 'node' },
		)

		expect(createTaskMock).toHaveBeenCalledWith('ws1', 'Task', {
			start_at: '2026-09-01T09:00:00.000Z',
			due_at: '2026-10-31T17:00:00.000Z',
		})
	})

	it('task update maps the clear date-time flags to null', async () => {
		updateTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'update', '123', '--clear-due-at', '--clear-start-at'], {
			from: 'node',
		})

		expect(updateTaskMock).toHaveBeenCalledWith('123', {
			due_at: null,
			start_at: null,
		})
	})

	it('task update sets start_on alongside due_on', async () => {
		updateTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			['node', 'test', 'task', 'update', '123', '--start-on', '2026-09-01', '--due-on', '2026-10-31'],
			{ from: 'node' },
		)

		expect(updateTaskMock).toHaveBeenCalledWith('123', {
			start_on: '2026-09-01',
			due_on: '2026-10-31',
		})
	})

	it('task update maps clear start flag to start_on null', async () => {
		updateTaskMock.mockResolvedValue({ gid: '1', name: 'Task' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'update', '123', '--clear-start-on'], { from: 'node' })

		expect(updateTaskMock).toHaveBeenCalledWith('123', {
			start_on: null,
		})
	})

	it('task follower add calls follower API helper', async () => {
		addFollowersToTaskMock.mockResolvedValue({ gid: '1' })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'follower', 'add', '123', 'u1', 'u2'], { from: 'node' })

		expect(addFollowersToTaskMock).toHaveBeenCalledWith('123', ['u1', 'u2'])
	})

	it('task get-many forwards gids and opt-fields to batch lookup', async () => {
		getTasksByGidMock.mockResolvedValue([{ gid: '123', ok: true, task: { gid: '123', name: 'Task 1' } }])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'get-many', '123', '456', '--opt-fields', 'gid,name,completed'], {
			from: 'node',
		})

		expect(getTasksByGidMock).toHaveBeenCalledWith(['123', '456'], {
			optFields: 'gid,name,completed',
		})
	})

	it('task get-many prints raw json with --json', async () => {
		getTasksByGidMock.mockResolvedValue([{ gid: '123', ok: true, task: { gid: '123', name: 'Task 1' } }])
		process.argv = ['node', 'test', '--json']
		const program = new Command().option('--json').addCommand(taskCommand())

		await program.parseAsync(['node', 'test', '--json', 'task', 'get-many', '123'], { from: 'node' })

		expect(logSpy).toHaveBeenCalledWith(
			JSON.stringify([{ gid: '123', ok: true, task: { gid: '123', name: 'Task 1' } }], null, 2),
		)
	})

	it('task list requests a minimal default field set when none is given', async () => {
		listTasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'list', '--project-gid', 'p1'], { from: 'node' })

		expect(listTasksMock).toHaveBeenCalledWith(
			'p1',
			expect.objectContaining({ optFields: 'gid,name,completed,due_on' }),
		)
	})

	it('task list respects an explicit --opt-fields override', async () => {
		listTasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'list', '--project-gid', 'p1', '--opt-fields', 'name,notes'], {
			from: 'node',
		})

		expect(listTasksMock).toHaveBeenCalledWith('p1', expect.objectContaining({ optFields: 'name,notes' }))
	})

	it('task my-tasks list requests a minimal default field set when none is given', async () => {
		getMyTasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'my-tasks', 'list', '--workspace-gid', 'ws1'], { from: 'node' })

		expect(getMyTasksMock).toHaveBeenCalledWith(
			'ws1',
			expect.objectContaining({ optFields: 'gid,name,completed,due_on' }),
		)
	})

	it('task my-tasks list respects an explicit --opt-fields override', async () => {
		getMyTasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			['node', 'test', 'task', 'my-tasks', 'list', '--workspace-gid', 'ws1', '--opt-fields', 'name,notes'],
			{ from: 'node' },
		)

		expect(getMyTasksMock).toHaveBeenCalledWith('ws1', expect.objectContaining({ optFields: 'name,notes' }))
	})

	it('task subtask list requests a minimal default field set when none is given', async () => {
		listSubtasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'subtask', 'list', '123'], { from: 'node' })

		expect(listSubtasksMock).toHaveBeenCalledWith(
			'123',
			expect.objectContaining({ optFields: 'gid,name,completed,due_on' }),
		)
	})

	it('task subtask list adds include-flag fields to the default field set', async () => {
		listSubtasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'subtask', 'list', '123', '--assignee-email'], { from: 'node' })

		expect(listSubtasksMock).toHaveBeenCalledWith(
			'123',
			expect.objectContaining({ optFields: 'gid,name,completed,due_on,assignee,assignee.email' }),
		)
	})

	it('task subtask list composes include flags with an explicit --opt-fields override', async () => {
		listSubtasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			['node', 'test', 'task', 'subtask', 'list', '123', '--opt-fields', 'gid,name', '--num-subtasks'],
			{ from: 'node' },
		)

		expect(listSubtasksMock).toHaveBeenCalledWith(
			'123',
			expect.objectContaining({ optFields: 'gid,name,num_subtasks' }),
		)
	})

	it('task subtask list does not repeat a field named by both the default and an include flag', async () => {
		listSubtasksMock.mockResolvedValue([])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(
			['node', 'test', 'task', 'subtask', 'list', '123', '--opt-fields', 'gid,assignee', '--assignee-email'],
			{ from: 'node' },
		)

		expect(listSubtasksMock).toHaveBeenCalledWith(
			'123',
			expect.objectContaining({ optFields: 'gid,assignee,assignee.email' }),
		)
	})

	it('task list prints an aggregate summary and next-step suggestions', async () => {
		listTasksMock.mockResolvedValue([
			{ gid: '1', name: 'A', completed: false },
			{ gid: '2', name: 'B', completed: true },
		])
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'list', '--project-gid', 'p1'], { from: 'node' })

		const lines = logSpy.mock.calls.map((c) => String(c[0]))
		expect(lines).toContain('\n2 task(s): 1 incomplete, 1 done')
		expect(lines).toContain('\nNext steps:')
		expect(lines.some((l) => l.includes('cyber-asana task get <gid>'))).toBe(true)
	})

	it('task get truncates long notes with a size hint by default', async () => {
		getTaskMock.mockResolvedValue({ gid: '1', name: 'Task', notes: 'x'.repeat(600) })
		const program = new Command().addCommand(taskCommand())

		await program.parseAsync(['node', 'test', 'task', 'get', '1'], { from: 'node' })

		const notesLine = logSpy.mock.calls.map((c) => String(c[0])).find((line) => line.startsWith('Notes'))
		expect(notesLine).toContain('[truncated, 600 chars total; use --full for the rest]')
	})

	it('task get shows full notes with --full', async () => {
		getTaskMock.mockResolvedValue({ gid: '1', name: 'Task', notes: 'x'.repeat(600) })
		process.argv = ['node', 'test', '--full']
		const program = new Command().option('--full').addCommand(taskCommand())

		await program.parseAsync(['node', 'test', '--full', 'task', 'get', '1'], { from: 'node' })

		const notesLine = logSpy.mock.calls.map((c) => String(c[0])).find((line) => line.startsWith('Notes'))
		expect(notesLine).not.toContain('[truncated')
		expect(notesLine).toContain('x'.repeat(600))
	})

	it('task --help includes a concise examples reference', () => {
		let help = ''
		const cmd = taskCommand()
		cmd.configureOutput({ writeOut: (s) => (help += s) })
		cmd.outputHelp()
		expect(help).toContain('Examples:')
		expect(help).toContain('cyber-asana task list')
	})

	it('task command can use injected dependencies', async () => {
		const injectedCreateTask = vi.fn().mockResolvedValue({ gid: '1', name: 'New Task' })
		const program = new Command().addCommand(
			taskCommand({
				listTasks: vi.fn(),
				listTasksForSection: vi.fn(),
				getTask: vi.fn(),
				getTasksByGid: vi.fn(),
				createTask: injectedCreateTask,
				updateTask: vi.fn(),
				deleteTask: vi.fn(),
				getMyTasks: vi.fn(),
				listSubtasks: vi.fn(),
				createSubtask: vi.fn(),
				addTaskToProject: vi.fn(),
				removeTaskFromProject: vi.fn(),
				addFollowersToTask: vi.fn(),
				removeFollowersFromTask: vi.fn(),
				getDependencies: vi.fn(),
				getDependents: vi.fn(),
				addDependencies: vi.fn(),
				addDependents: vi.fn(),
				removeDependencies: vi.fn(),
				removeDependents: vi.fn(),
				searchTasks: vi.fn(),
			}),
		)

		await program.parseAsync(['node', 'test', 'task', 'create', 'New Task', '--workspace-gid', 'ws1'], { from: 'node' })

		expect(injectedCreateTask).toHaveBeenCalledWith('ws1', 'New Task', {})
	})
})
