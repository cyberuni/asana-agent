import { Command } from 'commander'
import {
	addGidOption,
	addPaginationOptions,
	itemsForOutput,
	paginationOptionsFromCli,
	printNextPageHint,
	requiredGid,
} from '../cli-options.js'
import { output, printCountSummary, printFields, printNextSteps, printTable } from '../output.js'
import { isFull, truncate } from '../truncate.js'
import type { StoryApi } from './api.js'
import { createStory, getTaskTemplateData, interpolateTemplate, listStories } from './api.js'

const TEXT_COLUMN_LIMIT = 60

type Story = { gid: string; type?: string; text?: string; created_by?: { name: string } | null; created_at?: string }

function fmtStory(s: Story) {
	printFields({
		ID: s.gid,
		Type: s.type ?? null,
		By: s.created_by?.name ?? null,
		At: s.created_at ?? null,
		Text: truncate(s.text, { full: isFull() }) || null,
	})
}

function resolveStoryApi(api?: StoryApi | (() => StoryApi)): StoryApi {
	if (typeof api === 'function') return api()
	return api ?? { listStories, createStory, getTaskTemplateData }
}

// Minimal default schema for story lists — principle 2. Just the fields the
// table renders, instead of Asana's larger default payload.
const STORY_LIST_FIELDS = 'gid,type,text,created_at,created_by.name'

export function storyCommand(name = 'story', api?: StoryApi | (() => StoryApi)) {
	const cmd = new Command(name).description('Manage Asana stories (comments)')

	cmd.addHelpText(
		'after',
		[
			'',
			'Examples:',
			'  cyber-asana story list --task-gid <gid>',
			'  cyber-asana story list --task-gid <gid> --toon',
			'  cyber-asana story create "Looks good" --task-gid <gid>',
			'  cyber-asana story create "<p>Rich</p>" --task-gid <gid> --html-text "<body><p>Rich</p></body>"',
			'',
			'Every subcommand supports --help for its own options.',
		].join('\n'),
	)

	addPaginationOptions(
		addGidOption(cmd.command('list').description('List stories for a task'), 'task', 'Task GID'),
	).action(async (opts: { task?: string; taskGid?: string; limit?: number; offset?: string; optFields?: string }) => {
		const pagination = paginationOptionsFromCli(opts)
		pagination.optFields ??= STORY_LIST_FIELDS
		const data = await resolveStoryApi(api).listStories(requiredGid(opts, 'task', 'Task GID'), pagination)
		output(data, () => {
			const items = itemsForOutput(data)
			printTable(
				items,
				[
					{ label: 'ID', get: (s: Story) => s.gid },
					{ label: 'Type', get: (s: Story) => s.type ?? '' },
					{ label: 'By', get: (s: Story) => s.created_by?.name ?? '' },
					// The table stays readable at 60 characters; --full and the size hint come from truncate().
					{ label: 'Text', get: (s: Story) => truncate(s.text, { limit: TEXT_COLUMN_LIMIT, full: isFull() }) },
				],
				{ entity: 'stories' },
			)
			printCountSummary(items.length, 'story(s)')
			printNextPageHint(data)
			printNextSteps([
				`cyber-asana story create --task-gid ${requiredGid(opts, 'task', 'Task GID')} "<text>" — comment`,
			])
		})
	})

	addGidOption(
		cmd
			.command('create [text]')
			.description('Add a comment to a task')
			.option('--html-text <html>', 'Comment rich text as Asana HTML')
			.option(
				'--template',
				'Treat text as a template; interpolates {task.name}, {task.assignee}, {task.due_on}, {task.notes}',
			),
		'task',
		'Task GID',
	).action(
		async (
			text: string | undefined,
			opts: { task?: string; taskGid?: string; template?: boolean; htmlText?: string },
		) => {
			const taskGid = requiredGid(opts, 'task', 'Task GID')
			const task = opts.template ? await resolveStoryApi(api).getTaskTemplateData(taskGid) : undefined
			const data = await resolveStoryApi(api).createStory(taskGid, {
				...(text !== undefined && { text: task ? interpolateTemplate(text, task) : text }),
				...(opts.htmlText !== undefined && {
					html_text: task ? interpolateTemplate(opts.htmlText, task) : opts.htmlText,
				}),
			})
			output(data, () => fmtStory(data))
		},
	)

	return cmd
}
